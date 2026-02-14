import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SkipApiKey } from './skip-api-key.decorator';
import { WebhookService } from './webhook.service';

@ApiTags('Webhooks')
@Controller('webhook')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  @ApiOperation({
    summary: 'Handle incoming Notion webhook events (no API key required)',
  })
  @SkipApiKey()
  @Post('notion')
  async handleNotionWebhook(@Body() body: Record<string, unknown>) {
    // Verification handshake
    if (body.verification_token) {
      this.logger.log(`Webhook verification token: ${body.verification_token}`);
      return { verification_token: body.verification_token };
    }

    const eventType = body.type as string | undefined;
    const entity = body.entity as { id: string; type: string } | undefined;

    this.logger.log(`Received webhook event: ${eventType}`);

    if (entity?.type === 'page') {
      const workspaceId = body.workspace_id as string | undefined;

      const handler = this.resolveHandler(eventType, entity.id, workspaceId);
      if (handler) {
        handler.catch((err) => {
          this.logger.error(
            `Error processing ${eventType} for ${entity.id}: ${err.message}`,
            err.stack
          );
        });
      }
    }

    return { ok: true };
  }

  private resolveHandler(
    eventType: string | undefined,
    entityId: string,
    workspaceId?: string
  ): Promise<void> | null {
    switch (eventType) {
      case 'page.created':
        return this.webhookService.handlePageCreated(entityId, workspaceId);
      case 'page.properties_updated':
        return this.webhookService.handlePagePropertyUpdated(
          entityId,
          workspaceId
        );
      case 'page.content_updated':
        return this.webhookService.handlePageContentUpdated(
          entityId,
          workspaceId
        );
      case 'page.deleted':
        return this.webhookService.handlePageDeleted(entityId, workspaceId);
      default:
        return null;
    }
  }
}
