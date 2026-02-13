import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookService } from './webhook.service';
import { SkipApiKey } from './skip-api-key.decorator';

@SkipApiKey()
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @Post('notion')
  @HttpCode(200)
  async handleNotionWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-notion-signature') signature?: string
  ) {
    // Step 1: Subscription verification handshake
    if (body.verification_token) {
      this.logger.log('Webhook verification handshake received');
      return { verification_token: body.verification_token };
    }

    // Step 2: Validate signature (if NOTION_WEBHOOK_SECRET is set)
    const secret = process.env.NOTION_WEBHOOK_SECRET;
    if (secret && signature) {
      const calculated = `sha256=${createHmac('sha256', secret)
        .update(JSON.stringify(body))
        .digest('hex')}`;

      const isValid = timingSafeEqual(
        Buffer.from(calculated),
        Buffer.from(signature)
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new UnauthorizedException('Invalid webhook signature');
      }
    }

    // Step 3: Route by event type
    const eventType = body.type as string;
    this.logger.log(`Webhook event received: ${eventType}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const event = body as any;

    switch (eventType) {
      case 'page.created':
        await this.webhookService.handlePageCreated(event);
        break;
      case 'page.properties_updated':
        await this.webhookService.handlePagePropertiesUpdated(event);
        break;
      case 'page.content_updated':
        await this.webhookService.handlePageContentUpdated(event);
        break;
      case 'page.deleted':
        await this.webhookService.handlePageDeleted(event);
        break;
      default:
        this.logger.log(`Unhandled event type: ${eventType}`);
    }

    return { ok: true };
  }
}
