import { useEffect, useState } from 'react';

const Loader = props => {
	useEffect(() => {});

	return (
		<div className={`fixed top-0 left-0 right-0 bottom-0 bg-white-100 flex items-center justify-center z-10 ${props.className}`}>
			<div
				className="w-50px h-90px absolute left-[50%] translate-x-[-50%] inline-block text-[rgb(145_177_209_/_1)] align-middle pointer-events-none -z-10
                    before:absolute before:content-[''] before:h-20px before:w-[20px] before:top-0 before:bg-current before:rounded-100px before:right-0 before:animate-[loader-2_.5s_ease-in-out_infinite_alternate]
                    after:absolute after:content-[''] after:h-20px after:w-[20px] after:top-0 after:bg-current after:rounded-100px after:left-0  after:animate-[loader-1_.5s_ease-in-out_infinite_alternate]"></div>
		</div>
	);
};

export default Loader;
