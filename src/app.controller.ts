import { Controller, Get, Param, Query, Res, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('/:formId/filteredResponses')
  // query params: limit, afterDate, beforeDate, offset, status, includeEditLink, sort
  async getResponses(@Param('formId') form_id: string, @Query(new ValidationPipe({ transform: true })) filters: any, @Res() res: Response): Promise<Response> {
    const resp = await this.appService.getResponse(form_id, filters)

    return res.json(resp)
  }
}
