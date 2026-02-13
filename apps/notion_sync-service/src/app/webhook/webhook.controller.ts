import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SkipApiKey } from './skip-api-key.decorator';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @SkipApiKey()
  @Post('notion')
  async handleNotionWebhook(@Body() body: Record<string, unknown>) {
    // Verification handshake
    if (body.verification_token) {
      this.logger.log(
        `Webhook verification token: ${body.verification_token}`
      );
      return { verification_token: body.verification_token };
    }

    const eventType = body.type as string | undefined;
    const entity = body.entity as
      | { id: string; type: string }
      | undefined;

    this.logger.log(`Received webhook event: ${eventType}`);

    if (eventType === 'page.created' && entity?.type === 'page') {
      // Fire-and-forget so Notion gets a fast 200
      this.webhookService.handlePageCreated(entity.id).catch((err) => {
        this.logger.error(
          `Error processing page.created for ${entity.id}: ${err.message}`,
          err.stack
        );
      });
    }

    return { ok: true };
  }
}
