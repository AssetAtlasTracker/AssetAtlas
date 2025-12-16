import qrcode from 'qrcode';
import { authenticator } from '@otplib/preset-default';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';


export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const username = url.searchParams.get('username');
		
		if (!username) {
			return json({ error: 'Username is required' }, { status: 400 });
		}

		// TODO: Check database for account
		// const account = await db.getAccount(username);
		// if (!account) {
		//   return json({ error: 'Account not found' }, { status: 404 });
		// }

		// Generate secret for the user
		const secret = authenticator.generateSecret();
		
		// Create OTP auth URL
		const otpauth = authenticator.keyuri(username, 'AssetAtlas', secret);
		
		// Generate QR code
		const qrCodeDataUrl = await qrcode.toDataURL(otpauth);
		
		return json({ 
			success: true,
			qrCode: qrCodeDataUrl,
			secret: secret
		});
	} catch (error) {
		console.error('Error in GET /api/authenticator/check:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};