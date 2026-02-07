import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLiveEventDto } from './create-live-event.dto';

export class RegisterEventDto {
  @ApiPropertyOptional({
    description:
      'Event data for auto-creation. Required ONLY when registering for a mock/frontend event that does not yet exist in the backend. For existing backend events, omit this field.',
    type: CreateLiveEventDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLiveEventDto)
  eventData?: CreateLiveEventDto;
}
