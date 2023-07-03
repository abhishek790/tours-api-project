const nodemailer = require('nodemailer');

//we're gonna pass in some options basically So the email address where we want to send an email to the subject line, the email content and maybe some other stuff.
const sendEmail = async (options) => {
  // we need to follow 3 steps inorder send email with nodemailer
  //1) Create a transporter
  // transporter will actually send the email because nodejs does not send the email itself
  const transporter = nodemailer.createTransport({
    //passing options
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // auth property for authentication
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    // we are going to use a special development service which basically fakes to send emails to real addresses.But in reality, these emails end up trapped in a development inbox, so that we can then take a look at how they look later in production and that service is called mailtrap
  });
  //2)Define the email options
  const mailOptions = {
    from: 'Avsek Mishra <hello@avsek.com',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  //3)Actually send the email
  // this is async ()
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
