import qrcode from 'qrcode';
import { authenticator } from '@otplib/preset-default';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { AuthenticatorAccount } from '$lib/server/db/models/authenticatorAccount';
import { request } from 'http';


export const POST: RequestHandler = async ({ request }) => {
	try {
		const { username } = await request.json();

		if (!username) {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		let account = await AuthenticatorAccount.findOne({ username });
		if (!account) {
			const newSecret = authenticator.generateSecret();
			const newAccount = new AuthenticatorAccount({
				username: username,
				secret: newSecret,
			});
			await newAccount.save();
			account = newAccount
		}


		const secret = account.secret;

		// Create OTP auth URL
		const otpauth = authenticator.keyuri(username, 'AssetAtlas', secret);

		// Generate QR code
		const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

		return json({
			success: true,
			qrCode: qrCodeDataUrl,
			otpCode: secret
		});
	} catch (error) {
		console.error('Error in POST /api/authenticator/check:', error);
		return json({ error }, { status: 500 });
	}
};