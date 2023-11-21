import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AmocrmService } from './amocrm/amocrm.service';
import { HttpModule } from '@nestjs/axios';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ContactsController } from './contacts/contacts.controller';

@Module({
  imports: [
    HttpModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '/public'),
      // serveRoot: ' ',
    }),
  ],
  controllers: [AppController, ContactsController],
  providers: [AppService, AmocrmService],
})
export class AppModule {}
