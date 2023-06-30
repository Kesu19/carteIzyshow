import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalleService } from './salle/salle.service';
import { SalleController } from './controllers/salle.controller';

@Module({
  imports: [],
  controllers: [AppController,SalleController],
  providers: [AppService, SalleService],
})
export class AppModule {}
