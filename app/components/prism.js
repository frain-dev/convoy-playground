import React, { useEffect, useState } from "react";

import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-json";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "../scss/prism.scss";

const CodeRenderer = ({ title, language, code, type }) => {
    const [showMorePayload, setMorePayloadState] = useState(false);
    const [header, setHeaders] = useState([]);
    const [headersLength, setHeadersLength] = useState(0);

    const getHeaders = () => {
        if (type !== "headers") return;
        let headers = [];
        const selectedHeaders = code;

        Object.entries(selectedHeaders).forEach(([key, value]) => {
            headers.push({
                header: key,
                value: Array.isArray(value) ? value[0] : value,
            });
        });

        setHeadersLength(headers.length);
        showMorePayload ? setHeaders(headers) : setHeaders(headers.slice(0, 3));
    };

    useEffect(() => {
        getHeaders();
    }, []);

    useEffect(() => {
        getHeaders();
    }, [showMorePayload]);

    useEffect(() => {
        Prism.highlightAll();
    }, []);

    return (
        <div>
            <h4 className="py-8px text-12 text-gray-400">{title}</h4>
            {type !== "headers" && (
                <div className="border border-primary-25 rounded-8px mb-26px">
                    <pre className={`${language} line-numbers`}>
                        <code className={`${language} line-numbers`}>
                            {JSON.stringify(code, null, 4)?.replaceAll(
                                /"([^"]+)":/g,
                                "$1:"
                            )}
                        </code>
                    </pre>

                    {code && code.length > 300 && (
                        <div className="flex py-8px px-16px border-t border-primary-25">
                            <button
                                onClick={() =>
                                    showMorePayload
                                        ? setMorePayloadState(false)
                                        : setMorePayloadState(true)
                                }
                                className="text-12 font-medium text-primary-400 flex items-center"
                            >
                                <img
                                    src="/expand.svg"
                                    alt="expand icon"
                                    className="mr-10px"
                                />
                                {showMorePayload ? "Hide" : "Show more"} lines
                            </button>
                        </div>
                    )}
                </div>
            )}

            {type === "headers" && (
                <div className="border border-primary-25 rounded-8px mb-26px">
                    {header.map((header, index) => (
                        <div
                            key={index}
                            className="flex border-b border-primary-25 last-of-type:border-none p-16px text-12 text-gray-800"
                        >
                            <div className="w-2/5 font-medium uppercase">
                                {header.header}
                            </div>
                            <div className="w-3/5 whitespace-nowrap overflow-hidden text-ellipsis">
                                {header.value}
                            </div>
                        </div>
                    ))}

                    {headersLength > 3 && (
                        <div className="flex py-8px px-16px border-t border-primary-25">
                            <button
                                onClick={() =>
                                    showMorePayload
                                        ? setMorePayloadState(false)
                                        : setMorePayloadState(true)
                                }
                                className="text-12 font-medium text-primary-400 flex items-center"
                            >
                                <img
                                    src="/expand.svg"
                                    alt="expand icon"
                                    className="mr-10px"
                                />
                                {showMorePayload ? "Hide" : "Show more"} lines
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CodeRenderer;
