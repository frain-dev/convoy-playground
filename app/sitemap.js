export default function sitemap() {
	return [
		{
			url: 'https://playground.getconvoy.io',
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 1
		},
		{
			url: 'https://playground.getconvoy.io/in',
			lastModified: new Date(),
			changeFrequency: 'weekly',
			priority: 0.8
		}
	];
}
