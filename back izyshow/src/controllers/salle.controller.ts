import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { type } from 'os';

@Controller('salles')
export class SalleController {
  @Get()
  async recupererSalles(@Res() res: Response): Promise<void> {
    const salles: any[] = [];
    const fileStream = fs.createReadStream('src/salle/rooms.tsv');
    const userStream = fs.createReadStream('src/salle/users.tsv');

    const users: any[] = [];
    var nom
    userStream
      .pipe(csvParser({ separator: '\t' }))
      .on('data', (row: any) => {
        if (row.user_id) {
          const cleanedUserId = row.user_id.replace(/\n/g, '');
          users.push({ ...row, user_id: cleanedUserId });
        }
      })
      .on('end', () => {
        fileStream
          .pipe(csvParser({ separator: '\t' }))
          .on('data', (row: any) => {
            console.log(row)
            const user = users.find((u) => u.user_id === row.user_id);
            const salle = {
              nom: row.listing_title,
              address: user ? user.address : '',
              image : row.main_image_url,
              type_salle : row.type_salle,
              typeSalleDeDance : row.typeSalleDance,
              eclairage : row.eclairage,
              rideaux : row.rideaux,
              prix : row.price
              // Ajoutez d'autres propriétés nécessaires
            };
            if(salle.nom && salle.nom != nom){
                salles.push(salle);
                nom = salle.nom
            }

          })
          .on('end', () => {
            res.json(salles); // Renvoyer les données au front-end sous forme de JSON
          })
          .on('error', (error) => {
            res.status(500).json({
              error:
                "Une erreur s'est produite lors de la récupération des salles.",
            });
          });
      });
  }
}
