import nodemailer from 'nodemailer';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export const sendEmail = async (options: EmailOptions) => {
    const transporter = nodemailer.createTransport({
        // host: process.env.EMAIL_HOST,
        // port: process.env.EMAIL_PORT,
        // auth: {
        //     user: process.env.EMAIL_USER,
        //     pass: process.env.EMAIL_PASS
        // }

        service: "Gmail",
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: "support@pollnest.com",
          pass: "oukoymztqdkxglqz",
        },
    });

    const mailOptions = {
        // from: process.env.EMAIL_FROM,
        from: "support@pollnest.com",
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    await transporter.sendMail(mailOptions);
};
