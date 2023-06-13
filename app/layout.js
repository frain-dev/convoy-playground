import './styles.scss';
import { Inter } from 'next/font/google';
import Script from 'next/script';
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
	title: 'Convoy Playground',
	description: 'Convoy Playground'
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<head>
				<Script async src="https://www.googletagmanager.com/gtag/js?id=G-GTJK2CPP01"></Script>
				<Script>
					{`var dataLayer = window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments)}
					gtag('js', new Date()); gtag('config', 'G-GTJK2CPP01');`}
				</Script>
			</head>

			<body className={`${inter.className} bg-[#FAFAFE]`} suppressHydrationWarning={true}>
				<header className="w-full bg-white-100 border-b border-b-grey-10 fixed top-0 z-[60]">
					<div className="flex items-center justify-between w-full max-w-[1200px] m-auto bg-white-100 px-20px py-12px">
						<a href="/" rel="noreferrer">
							<img src="/convoy-logo.svg" alt="convoy logo" className="w-100px" />
						</a>

						<a className="flex items-center mr-16px" target="_blank" href="https://getconvoy.io/docs" rel="noreferrer">
							<img src="/file.svg" alt="file icon" />
							<span className="font-medium text-14 text-primary-400 ml-2">Go to docs</span>
						</a>
					</div>
					<div className="bg-primary-25 p-12px w-full text-center text-primary-400 text-14">
						<a target="_blank" rel="noopener noreferrer" href="https://github.com/frain-dev/convoy" className="flex items-center justify-center">
							<span>If you like what we do give us a star</span>
							<span className="mx-4px">
								<img src="/github-star.svg" alt="star icon" />
							</span>
							<span>on Github!</span>
						</a>
					</div>
				</header>

				{children}
			</body>
		</html>
	);
}
