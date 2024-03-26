import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

type FilterClauseType = {
  id: string;
  condition: 'equals' | 'does_not_equal' | 'greater_than' | 'less_than';
  value: number | string;
}
@Injectable()
export class AppService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) { }

  async getResponse(formId: string, filters: any): Promise<any> {
    const url = this.configService.get('FILLOUT_ENDPOINT_URL');
    const token = this.configService.get('FILLOUT_API_KEY');

    // parse stringyfied filters
    const all_filters = JSON.parse(filters.filters) ?? undefined

    //parse /v1/forms/submissions
    const body = await firstValueFrom(
      this.httpService.get(`/v1/api/forms/${formId}/submissions?${this.encodeDataToURL(filters)}`, {
        baseURL: url,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    );

    //actual filter
    const data = body.data

    //map data.responses
    const filtered = data.responses.map(item => {

      //filter questions only key
      const filteredQuestions = item.questions.filter(question => {

        // find if the stringyfied filters id matches some of question id
        const condition: FilterClauseType = all_filters.find(filter => {
          return filter.id === question.id;
        });


        if (!condition) return false; // Exclude if condition is not specified

        // switch for conditions
        switch (condition.condition) {
          case "equals":
            return question.value === condition.value;
          case "does_not_equal":
            return question.value !== condition.value;
          case "greater_than":
            return new Date(question.value) > new Date(condition.value);
          case "less_than":
            return new Date(question.value) < new Date(condition.value);
          default:
            return true;
        }
      });

      //return the filtered results
      return {
        ...item,
        questions: filteredQuestions,
      };

    });

    data.responses = filtered
    data.filters = all_filters
    
    return data;
  }

  private encodeDataToURL(data) {
    return Object
      .keys(data)
      .map(value => `${value}=${encodeURIComponent(data[value])}`)
      .join('&');
  }

}
