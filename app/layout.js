import "./styles.scss";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Convoy Playground",
  description: "Convoy Playground",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#FAFAFE]`}>
        <header className="w-full bg-white-100 border-b border-b-grey-10">
          <div className="flex items-center justify-between w-full max-w-[1440px] m-auto bg-white-100 px-64px py-12px">
            <a href="/" rel="noreferrer">
              <img
                src="/convoy-logo.svg"
                alt="convoy logo"
                className="w-100px"
              />
            </a>

            <a
              className="flex items-center mr-16px"
              target="_blank"
              href="https://getconvoy.io/docs"
              rel="noreferrer"
            >
              <img src="/file.svg" alt="file icon" />
              <span className="font-medium text-14 text-primary-400 ml-2">
                Go to docs
              </span>
            </a>
          </div>
        </header>
        <div className="bg-primary-25 p-12px w-full text-center text-primary-400 text-14">
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/frain-dev/convoy"
            className="flex items-center justify-center"
          >
            <span>If you like what we do give us a star</span>
            <span className="mx-4px">
              <img src="/github-star.svg" alt="star icon" />
            </span>
            <span>on Github!</span>
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}
