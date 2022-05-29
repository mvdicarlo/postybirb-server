import { Controller, Get, Req } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello(@Req() req): string {
    return 'online' + ': ' + req.ip;
  }

}
