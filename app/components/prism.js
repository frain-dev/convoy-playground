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
    <div className="bg-gray-100 border border-gray-200 rounded-8px mb-26px">
      <h4 class="border-b border-gray-200 py-8px px-22px rounded-tl-8px rounded-tr-8px text-14 text-gray-400">
        {title}
      </h4>

      <pre className={`${language} line-numbers`}>
        <code className={`${language} line-numbers`}>
          {JSON.stringify(code, null, 4).replaceAll(/"([^"]+)":/g, "$1:")}
        </code>
      </pre>

      {code && code.length > 300 && (
        <div class="flex justify-end py-8px px-16px border-t border-gray-200">
          <button
            onClick={() =>
              showMorePayload
                ? setMorePayloadState(false)
                : setMorePayloadState(true)
            }
            className="text-12 font-medium text-primary-400 flex items-center"
          >
            {showMorePayload ? "Hide" : "Show more"} lines
            <img src="/angle-down-primary.svg" alt="angle-down icon" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeRenderer;
