export const AUTH_COOKIE_NAME = 'access_token';

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
	if (!cookieHeader) {
		return {};
	}

	return cookieHeader.split(';').reduce<Record<string, string>>((cookies, entry) => {
		const separatorIndex = entry.indexOf('=');
		if (separatorIndex === -1) {
			return cookies;
		}

		const key = entry.slice(0, separatorIndex).trim();
		const value = entry.slice(separatorIndex + 1).trim();
		cookies[key] = decodeURIComponent(value);
		return cookies;
	}, {});
}

export function extractAuthTokenFromCookieHeader(cookieHeader: string | undefined): string | null {
	const cookies = parseCookieHeader(cookieHeader);
	return cookies[AUTH_COOKIE_NAME] ?? null;
}

export function isAllowedOrigin(origin: string | null | undefined): boolean {
	if (!origin) {
		return true;
	}

	try {
		const url = new URL(origin);
		const hostname = url.hostname.toLowerCase();

		if (
			hostname === 'localhost' ||
			hostname === '127.0.0.1'
		) {
			return true;
		}

		if (
			hostname.startsWith('192.168.') ||
			hostname.startsWith('10.') ||
			/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
		) {
			return true;
		}

		return false;
	} catch {
		return false;
	}
}
