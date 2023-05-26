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
        <div>
            <h4 className="py-8px text-12 text-gray-400">{title}</h4>
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
        </div>
    );
};

export default CodeRenderer;
