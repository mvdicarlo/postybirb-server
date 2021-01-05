import { Controller, Get, Post, Body } from '@nestjs/common';
import { TwitterService } from './twitter.service';
import { TwitterAuthorization } from './models/twitter-authorization.model';
import { SubmissionPost } from 'src/v2/common/models/submission-post.model';

@Controller('twitter')
export class TwitterController {
  constructor(private readonly service: TwitterService) {}

  @Get('v2/authorize')
  startAuthorization() {
    return this.service.startAuthorization();
  }

  @Post('v2/authorize')
  completeAuthorization(@Body() data: TwitterAuthorization) {
    return this.service.completeAuthorization(data);
  }

  @Post('v2/post')
  post(@Body() data: SubmissionPost<null>) {
    return this.service.post(data);
  }
}
