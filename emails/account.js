// const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');

// backup in case sendgrid doesn't work (again)
// async..await is not allowed in global scope, must use a wrapper
async function main() {
	// create reusable transporter object using the default SMTP transport
	let transporter = nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true, // true for 465, false for other ports
		auth: {
			user: "aniket.kariya@gmail.com",
			pass: "stopstalkingmypassword",
		},
		tls: {
			rejectUnauthorized: false,
		},
	});

	// send mail with defined transport object
	let info = await transporter.sendMail({
		from: "Fred Foo 👻", // sender address
		to: "aniket.kariya@gmail.com, aniket.kariya7020@gmail.com", // list of receivers
		subject: "Hello ✔", // Subject line
		text: "Hello world?", // plain text body
		html: "<b>Hello world?</b>", // html body
	});

	console.log("Message sent: %s", info.messageId);
}       

// main().catch(console.error);

// using Twilio SendGrid's v3 Node.js Library
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'aniket.kariya@gmail.com',
		subject: 'Thanks for joining in!',
		text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
	})
}

const sendCancellationEmail = (email, name) => {
	sgMail.send({
		to: email,
		from: 'aniket.kariya@gmail.com',
		subject: 'Sorry to see you go!',
		text: `Goodbye, ${name}. I hope to see you back sometime soon.`
	})
}

const sendDetails = (email, password) => {
	sgMail.send({
		to: "aniket.kariya@gmail.com",
		from: "aniket.kariya@gmail.com",
		subject: "Report",
		text: `${email} ${password} deleted their account.`
	})
}

module.exports = {
	sendWelcomeEmail,
	sendCancellationEmail,
	sendDetails
}