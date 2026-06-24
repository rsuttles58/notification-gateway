import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  @HttpCode(202)
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Replays with the same key return the original notification.',
  })
  create(
    @Body() dto: CreateNotificationDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.notifications.enqueue(dto, idempotencyKey);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.findOne(id);
  }
}
