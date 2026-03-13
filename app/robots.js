export default function robots() {
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/'
			}
		],
		sitemap: 'https://playground.getconvoy.io/sitemap.xml'
	};
}
