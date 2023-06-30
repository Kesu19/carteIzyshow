import { Injectable } from '@nestjs/common';
import * as fs from 'fs';

@Injectable()
export class SalleService {
  recupererSalles(nomFichierTsv: string): string[] {
    const salles: string[] = [];
    const fichier = fs.readFileSync('src/salle/rooms.tsv', 'utf8');
    const lignes = fichier.split('\n');
    lignes.forEach((ligne) => {
        console.log(ligne)
      const colonnes = ligne.split('\t');
      if (colonnes.length > 0) {
        const nomSalle = colonnes[0];
        salles.push(nomSalle);
      }
    });
    return salles;
  }
}
