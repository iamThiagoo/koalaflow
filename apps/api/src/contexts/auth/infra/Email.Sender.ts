import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailSender {
  private readonly ses = new SESv2Client();

  async sendSignInCode(to: string, code: string): Promise<void> {
    await this.ses.send(
      new SendEmailCommand({
        FromEmailAddress: process.env.EMAIL_FROM,
        Destination: { ToAddresses: [to] },
        Content: {
          Simple: {
            Subject: {
              Data: 'Seu código de acesso ao Koalaflow',
              Charset: 'UTF-8',
            },
            Body: {
              Text: {
                Data: `Seu código de acesso: ${code}\n\nEle expira em 5 minutos. Se você não pediu este código, ignore este e-mail.`,
                Charset: 'UTF-8',
              },
            },
          },
        },
      }),
    );
  }
}
