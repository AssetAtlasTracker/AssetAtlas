import qrcode from 'qrcode';
import { authenticator } from '@otplib/preset-default';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { Login } from '$lib/server/db/models/login';


export const POST: RequestHandler = async ({ request }) => {
	try {
		const { username } = await request.json();
		let accountExisted = true;

		if (!username) {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		let account = await Login.findOne({ name:username, service_type: 'authenticator' });
		console.log("tried to find account:", username, "thing: ",  account);
		if (!account) {
			accountExisted = false;
			let permLevel = Login.length > 0 ? 1 : 10; // Default to basic level, unless first user

			const newSecret = authenticator.generateSecret();
			const newAccount = new Login({
				login_id: newSecret,
    			name: username,
    			service_type: "authenticator",
    			permissionLevel: permLevel
			});
			await newAccount.save();
			account = newAccount
		}


		const secret = account.login_id;

		// Create OTP auth URL
		const otpauth = authenticator.keyuri(username, 'AssetAtlas', secret);

		// Generate QR code
		const qrCodeDataUrl = await qrcode.toDataURL(otpauth);

		if (accountExisted) {
			return json({
				success: true,
				otpCode: secret
			});
		} else {
			return json({
				success: true,
				qrCode: qrCodeDataUrl,
				otpCode: secret
			});
		}

		
	} catch (error) {
		console.error('Error in POST /api/authenticator/check:', error);
		return json({ error }, { status: 500 });
	}
};