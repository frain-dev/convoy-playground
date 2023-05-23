import React, { useEffect, useState } from "react";

import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-json";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "../scss/prism.css";

const CodeRenderer = ({ title, language, code }) => {
    const [showMorePayload, setMorePayloadState] = useState(false);

    useEffect(() => {
        Prism.highlightAll();
    }, []);

    return (
        <div className="border border-primary-25 rounded-8px mb-26px">
            <h4 className="border-b border-primary-25 bg-primary-25 py-8px px-22px rounded-tl-8px rounded-tr-8px text-14 text-gray-600">
                {title}
            </h4>

            <pre className={`${language} line-numbers`}>
                <code className={`${language} line-numbers`}>
                    {JSON.stringify(code, null, 4).replaceAll(
                        /"([^"]+)":/g,
                        "$1:"
                    )}
                </code>
            </pre>

            {code && code.length > 300 && (
                <div className="flex justify-end py-8px px-16px border-t border-primary-25">
                    <button
                        onClick={() =>
                            showMorePayload
                                ? setMorePayloadState(false)
                                : setMorePayloadState(true)
                        }
                        className="text-12 font-medium text-primary-400 flex items-center"
                    >
                        {showMorePayload ? "Hide" : "Show more"} lines
                        <img
                            src="/angle-down-primary.svg"
                            alt="angle-down icon"
                        />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CodeRenderer;
