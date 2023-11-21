import { Controller, Get, Query } from '@nestjs/common';
import { AmocrmService } from 'src/amocrm/amocrm.service';

@Controller('contacts')
export class ContactsController {
  constructor(private amoService: AmocrmService) {}

  @Get()
  async getContact(
    @Query() params: { name: string; phone: string; email: string },
  ) {
    const { name, phone, email } = params;
    let contact;

    contact = await this.amoService.getContactByPhone(phone);
    if (!contact) contact = await this.amoService.getContactByEmail(email);
    if (!contact)
      contact = await this.amoService.createContact(name, phone, email);
    else
      contact = await this.amoService.updateContact(
        contact.id,
        name,
        phone,
        email,
      );
    return await this.amoService.createLead(contact.id, 'Сделка', 1000);
  }
}
