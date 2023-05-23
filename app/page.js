"use client";
import React, { useEffect, useState } from "react";
import Prism from "prismjs";
import CodeRenderer from "./components/prism";

export default function Home() {
    const tabs = ["request", "response"];
    const tableIndex = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const subscriptions = ["Subscription A", "Subscription B"];
    const showEvents = true;
    const [activeTab, setActiveTab] = useState("request");
    const [showUrlForm, setUrlFormState] = useState(false);
    const [showDestinationUrl, setShowDestinationUrl] = useState(false);
    const [destinationUrl, setDestinationUrl] = useState("");

    const [showSubscriptionDropdown, setSubscriptionDropdownState] =
        useState(false);
    const [activeSubscription, setActiveSubscription] =
        useState("Subscription A");

    const codeSnippet = {
        Accept: "*/*",
        "Api-Key": "secret",
        "Content-Length": "179",
        "Content-Type": "application/json",
        "User-Agent": "Convoy/v0.9.2",
        "X-Convoy-Signature":
            "t=1683636651,v1=4b8090d03b912d691cf8ddc1f2963b806af237807a18523ce04808ff1631a5c5",
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            setUrlFormState(false);
            setShowDestinationUrl(true);
            setDestinationUrl(event.target.value);

            console.log(event.target.value);
        }
    };
    useEffect(() => {
        Prism.highlightAll();
    }, []);

    return (
        <React.Fragment>
            <div className="pt-60px max-w-[1200px] m-auto">
                <h2 className="text-18 text-center font-semibold">
                    Convoy Playground
                </h2>
                <p className="text-center text-12 text-gray-500 m-auto max-w-[460px]">
                    A playground for you to receive and send out webhook events,
                    test, debug and review webhook events; just like you will
                    with Convoy{" "}
                </p>

                <div className="relative mt-24px w-fit m-auto">
                    <div className="flex items-center max-w-[700px] min-w-[590px] h-46px bg-white-100 rounded-4px border border-primary-25 pr-16px">
                        <div>
                            <button
                                onClick={() =>
                                    setSubscriptionDropdownState(true)
                                }
                                className="flex items-center py-14px px-16px text-gray-600 text-14 border-r border-primary-25"
                            >
                                {activeSubscription}
                                <img
                                    src="/angle-down.svg"
                                    alt="angle-down icon"
                                    className={`ml-28px transition-all duration-300 ease-in-out ${
                                        showSubscriptionDropdown
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                />
                            </button>
                        </div>
                        <div className="flex items-center p-14px">
                            <span className="text-gray-600 text-14 mr-16px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                http://localhost:5005/ingest/ikR6pN4ED9X13vNT
                            </span>
                            <button className="border border-gray-200 rounded-4px p-2px">
                                <img src="/copy.svg" alt="copy icon" />
                            </button>
                        </div>
                        <img
                            src="/arrow-right.svg"
                            alt="arrow-right icon"
                            className="mx-10px"
                        />
                        <div className="flex items-center justify-end">
                            {!showUrlForm && !showDestinationUrl && (
                                <button
                                    onClick={() => setUrlFormState(true)}
                                    className="text-10 text-gray-600 rounded-8px py-6px px-12px border border-gray-300"
                                >
                                    Add Destination
                                </button>
                            )}
                            {showUrlForm && !showDestinationUrl && (
                                <div className="flex items-center">
                                    <input
                                        type="text"
                                        className="border-none focus:outline-none focus:border-none text-14 text-black placeholder:text-gray-100 pr-10px"
                                        placeholder="Enter Url"
                                        onKeyDown={handleKeyDown}
                                    />
                                    <button
                                        onClick={() => handleKeyDown}
                                        className="border border-gray-200 rounded-4px p-4px ml-auto"
                                    >
                                        <img
                                            src="/check.svg"
                                            alt="checkmark icon"
                                        />
                                    </button>
                                </div>
                            )}
                            {!showUrlForm && showDestinationUrl && (
                                <div className="flex items-center w-full">
                                    <p className="text-gray-500 text-14 mr-16px max-w-[120px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                        {destinationUrl}
                                    </p>

                                    <button
                                        onClick={() => {
                                            setUrlFormState(true);
                                            setShowDestinationUrl(false);
                                        }}
                                        className="border border-gray-200 rounded-4px p-4px ml-auto"
                                    >
                                        <img src="/edit.svg" alt="edit icon" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {showSubscriptionDropdown && (
                        <div className="transition-all ease-in-out duration-300 absolute top-[110%] max-w-[560px] w-full bg-white-100 border border-primary-25 rounded-4px shadow-default z-10 h-fit max-h-[100px]">
                            {subscriptions.map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center px-14px py-10px"
                                >
                                    <div className="relative group w-fit h-fit border-0">
                                        <input
                                            id={item}
                                            type="radio"
                                            value={item}
                                            checked={
                                                activeSubscription === item
                                            }
                                            onChange={() => {
                                                setActiveSubscription(item);
                                                setSubscriptionDropdownState(
                                                    false
                                                );
                                            }}
                                            className="opacity-0 absolute"
                                        />
                                        <label
                                            for={item}
                                            className="flex items-center "
                                        >
                                            <div className="rounded-4px group-focus:shadow-focus--primary group-hover:shadow-focus--primary">
                                                <div
                                                    className={`border border-primary-400 rounded-4px h-12px w-12px group-hover:bg-primary-25 transition-all duration-200 ${
                                                        activeSubscription ===
                                                            item ??
                                                        "bg-primary-25"
                                                    }`}
                                                >
                                                    {activeSubscription ===
                                                        item && (
                                                        <img
                                                            src="/checkmark-primary.svg"
                                                            alt="checkmark icon"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-14 text-gray-600 px-10px  border-r border-primary-25">
                                                {item}
                                            </p>
                                        </label>
                                    </div>

                                    <p className="text-12 text-gray-600 pl-10px max-w-[181px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                        http://localhost:5005/ingest/ikR6pN4ED9X13vNT
                                    </p>
                                    <img
                                        src="/arrow-right.svg"
                                        alt="arrow-right icon"
                                        className="mx-10px"
                                    />
                                    <p className="text-12 text-gray-600 max-w-[138px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                        https://webhook.site/b5505843-da53-495f-96f2-d87f0042d8f9
                                        {/* no destination set... */}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {!showEvents && (
                    <div className="max-w-[564px] w-full m-auto rounded-12px bg-white-100 h-340px shadow-sm flex flex-col items-center justify-center mt-34px">
                        <img
                            src="/empty-state.svg"
                            alt="empty state icon"
                            className="mb-48px"
                        />

                        <p className="text-center text-14 text-gray-400 font-medium">
                            Waiting for your first event...
                        </p>
                    </div>
                )}

                {showEvents && (
                    <div className="flex mb-200px mt-40px">
                        <div className="min-w-[660px] mr-16px w-full  overflow-hidden rounded-8px bg-white-100 border border-primary-25">
                            <div className="min-h-[70vh]">
                                <div className="w-full border-b border-gray-200">
                                    <div className="flex items-center border-b border-gray-200 py-10px px-16px">
                                        <div className="w-2/5 text-14 text-gray-400">
                                            17 Jan, 2022
                                        </div>
                                        <div className="w-3/5"></div>
                                    </div>
                                    {tableIndex.map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-center py-10px px-16px"
                                        >
                                            <div className="w-1/5">
                                                <div className="flex items-center justify-center px-12px py-2px text-14 w-fit rounded-24px bg-success-50 text-success-400">
                                                    200 Success
                                                </div>
                                            </div>
                                            <div className="w-1/2">
                                                <div className="flex items-center justify-center px-12px py-2px text-14 w-fit whitespace-nowrap overflow-ellipsis rounded-24px bg-gray-50 text-gray-400">
                                                    <span className="max-w-[200px] overflow-hidden text-ellipsis">dfi30-9hfk89-ds0k89-k89k89...</span>
                                                    <button className="border-none bg-transparent">
                                                        <img
                                                            src="/copy.svg"
                                                            alt="copy icon"
                                                            className="ml-4px"
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="w-1/5 ml-auto flex items-center justify-around">
                                                <div className="text-14 text-gray-500">
                                                    10:45:11Am
                                                </div>
                                                <button className="border-none bg-transparent">
                                                    <img
                                                        src="/arrow-up-right.svg"
                                                        alt="arrow right up icon"
                                                    />
                                                </button>
                                                <button className="border-none bg-transparent">
                                                    <img
                                                        src="/refresh.svg"
                                                        alt="refresh icon"
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </div>
                            <div className="flex items-center justify-between mt-16px px-10px pb-10px">
                                <div className="flex items-center">
                                    <button className="flex items-center px-14px py-6px rounded-8px border border-primary-400 text-primary-400 text-12">
                                        <img
                                            src="/angle-left.svg"
                                            alt="angle right icon"
                                            className="mr-6px"
                                        />
                                        Previous
                                    </button>
                                    <button className="ml-24px flex items-center px-14px py-6px rounded-8px border border-primary-400 text-primary-400 text-12">
                                        Next
                                        <img
                                            src="/angle-right.svg"
                                            alt="angle left icon"
                                            className="ml-6px"
                                        />
                                    </button>
                                </div>

                                <p className="font-medium text-12 text-gray-400">
                                    1-50 of 234
                                </p>
                            </div>
                        </div>
                        <div className="max-w-[510px] w-full min-h-[70vh] rounded-8px bg-white-100 border border-primary-25">
                            <div className="flex items-center justify-between border-b border-gray-200">
                                <ul className="flex flex-row m-auto w-full">
                                    {tabs.map((tab) => (
                                        <li
                                            key={tab}
                                            className="mr-24px !list-none first-of-type:ml-16px last-of-type:mr-0"
                                        >
                                            <button
                                                className={
                                                    activeTab === tab
                                                        ? "pb-12px pt-8px flex items-center active"
                                                        : "pb-12px pt-8px flex items-center"
                                                }
                                                onClick={() =>
                                                    setActiveTab(tab)
                                                }
                                            >
                                                <span className="text-12 text-left capitalize text-gray-500 tracking-[0.02em]">
                                                    {tab}
                                                </span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                <button className="flex items-center rounded-4px pl-10px pr-16px py-2px mr-16px bg-primary-25 text-12 text-primary-400">
                                    <img
                                        src="/refresh-primary.svg"
                                        alt="refresh icon"
                                        className="mr-4px"
                                    />
                                    Retry
                                </button>
                            </div>

                            {activeTab === "request" && (
                                <div className="p-16px">
                                    <CodeRenderer
                                        title="Header"
                                        language="language-json"
                                        code={codeSnippet}
                                        className="mb-26px"
                                    />
                                    <CodeRenderer
                                        title="Response"
                                        language="language-json"
                                        code={codeSnippet}
                                        className="mb-26px"
                                    />
                                </div>
                            )}
                            {activeTab === "response" && (
                                <div className="p-16px">
                                    <CodeRenderer
                                        title="Header"
                                        language="language-json"
                                        code={codeSnippet}
                                    />
                                    <CodeRenderer
                                        title="Body"
                                        language="language-json"
                                        code={codeSnippet}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {showSubscriptionDropdown && (
                <div
                    className="fixed h-screen w-screen top-0 right-0 bottom-0 z-[5]"
                    onClick={() => setSubscriptionDropdownState(false)}
                ></div>
            )}
        </React.Fragment>
    );
}
