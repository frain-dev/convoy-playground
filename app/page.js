"use client";
import React, { useCallback, useEffect, useState } from "react";
import CodeRenderer from "./components/prism";
import { format } from "date-fns";

import * as axios from "axios";
const _axios = axios.default;
export default function Home() {
    const tabs = ["request", "response"];
    const tableIndex = [0, 1, 2, 3, 4, 5];

    const [subscriptions, setSubscriptions] = useState(null);
    const [activeTab, setActiveTab] = useState("request");
    const [showUrlForm, setUrlFormState] = useState(false);
    const [showDestinationUrl, setShowDestinationUrl] = useState(false);
    const [destinationUrl, setDestinationUrl] = useState("");
    const [displayedEventDeliveries, setDisplayedEventDeliveries] = useState(
        []
    );

    const [showSubscriptionDropdown, setSubscriptionDropdownState] =
        useState(false);
    const [activeSubscription, setActiveSubscription] = useState(null);
    const [fetchingEventDeliveries, setFetchingEventDeliveries] =
        useState(true);
    const [fetchingDeliveryAttempt, setFetchingDeliveryAttemt] =
        useState(false);
    const [selectedEventDelivery, setSelectedEventDelivery] = useState(null);
    const [selectedEventDeliveryAttempt, setSelectedEventDeliveryAttempt] =
        useState(null);

    const months = [
        "Jan",
        "Feb",
        "Mar",
        "April",
        "May",
        "June",
        "July",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
    ];

    const formatDate = (date) => {
        return format(new Date(date), "d LLL, yyyy");
    };

    const formatTime = (time) => {
        return format(new Date(time), "HH:mm:ssaaa");
    };

    const getDate = (date) => {
        const _date = new Date(date);
        const day = _date.getDate();
        const month = _date.getMonth();
        const year = _date.getFullYear();
        return `${day} ${months[month]}, ${year}`;
    };

    const setEventDeliveriesDisplayed = (eventDels) => {
        const dateCreateds = eventDels.map((item) => getDate(item.created_at));
        const uniqueDateCreateds = [...new Set(dateCreateds)];
        let displayedItems = [];
        uniqueDateCreateds.forEach((itemDate) => {
            const filteredItemDate = eventDels.filter(
                (item) => getDate(item.created_at) === itemDate
            );
            const contents = { date: itemDate, content: filteredItemDate };
            displayedItems.push(contents);
            displayedItems = displayedItems.sort(
                (a, b) => Number(new Date(b.date)) - Number(new Date(a.date))
            );
        });
        setDisplayedEventDeliveries(displayedItems);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            setUrlFormState(false);
            setShowDestinationUrl(true);
            setDestinationUrl(event.target.value);

            console.log(event.target.value);
        }
    };

    const projectId = "01H195H04C809ETXRMGA5YQNSB";
    const apiURL = `http://localhost:3000/api/v1/projects/${projectId}`;
    const token =
        "CO.3ZaW3n5fGnnWmY0Y.4rxWtOMB38FTPBf49jvbmstRXsPdnKx7wtA9nKOZsvE1dP1VvCy3kzmLQ4on9lOm";

    const request = _axios.create({
        baseURL: apiURL,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    request.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    const getSubscriptions = useCallback(async () => {
        try {
            const subscriptionResponse = await (
                await request({
                    url: `/subscriptions`,
                })
            ).data;
            setSubscriptions(subscriptionResponse.data.content);
            setActiveSubscription(subscriptionResponse.data.content[0]);
            getEventDeliveries();
        } catch (error) {
            return error;
        }
    }, []);

    // copy item to clipboard
    const copyToClipboard = (event, textToCopy) => {
        event.stopPropagation();
        if (!textToCopy) return;
        const textField = document.createElement("textarea");
        textField.innerText = textToCopy;
        document.body.appendChild(textField);
        textField.select();
        document.execCommand("copy");
        textField.remove();
    };

    // fetch event eventDeliveries
    const getEventDeliveries = useCallback(async () => {
        setFetchingEventDeliveries(true);
        try {
            const eventDeliveriesResponse = await (
                await request({
                    url: `/eventdeliveries?sort=AESC`,
                    method: "GET",
                })
            ).data;
            // set event deliveries for display
            setEventDeliveriesDisplayed(eventDeliveriesResponse.data.content);

            // select first event delivery and fetch attempt
            const activeEventDelivery = eventDeliveriesResponse.data.content[0];
            setSelectedEventDelivery(activeEventDelivery);
            getEventDeliveryAttempt(activeEventDelivery.uid);

            setFetchingEventDeliveries(false);
        } catch (error) {
            setFetchingEventDeliveries(false);
            return error;
        }
    }, []);

    // fetch event eventDeliveries
    const getEventDeliveryAttempt = useCallback(async (eventDeliveryId) => {
        setFetchingDeliveryAttemt(true);
        try {
            const eventDeliveryAttemptResponse = await (
                await request({
                    url: `/eventdeliveries/${eventDeliveryId}/deliveryattempts`,
                    method: "GET",
                })
            ).data;

            const activeDeliveryAttempt = eventDeliveryAttemptResponse.data[0];
            setSelectedEventDeliveryAttempt(activeDeliveryAttempt);
            console.log(eventDeliveryAttemptResponse);

            setFetchingDeliveryAttemt(false);
            Prism.highlightAll();
        } catch (error) {
            setFetchingDeliveryAttemt(false);
            return error;
        }
    }, []);

    // retyr event delivery if delivery attempt is unsuccessful
    const retryEvent = async (event, index, eventDeliveryId) => {
        event.stopPropagation();
        const retryButton = document.querySelector(
            `#eventDelivery${index} button`
        );
        retryButton.classList.add(["spin", "disable_action"]);
        retryButton.disabled = true;

        try {
            await (
                await request({
                    method: "PUT",
                    url: `/eventdeliveries/${eventDeliveryId}/resend`,
                })
            ).data;
            retryButton.classList.remove(["spin", "disable_action"]);
            retryButton.disabled = false;
            getEvents({ page: events.pagination.page, appUid: appUid });
        } catch (error) {
            retryButton.classList.remove(["spin", "disable_action"]);
            retryButton.disabled = false;
            return error;
        }
    };

    // force retry event upon a successful delivery
    const forceRetryEvent = async (event, index, eventDeliveryId) => {
        event.stopPropagation();
        const retryButton = document.querySelector(
            `#eventDelivery${index} button`
        );
        retryButton.classList.add(["spin", "disable_action"]);
        retryButton.disabled = true;

        const payload = {
            ids: [eventDeliveryId],
        };
        try {
            await (
                await request({
                    method: "POST",
                    url: `/eventdeliveries/forceresend`,
                    body: payload,
                })
            ).data;
            retryButton.classList.remove(["spin", "disable_action"]);
            retryButton.disabled = false;
            getEvents({ page: events.pagination.page, appUid: appUid });
        } catch (error) {
            retryButton.classList.remove(["spin", "disable_action"]);
            retryButton.disabled = false;
            return error;
        }
    };

    useEffect(() => {
        getSubscriptions();
    }, [getSubscriptions]);

    return (
        <React.Fragment>
            <div className="pt-60px max-w-[1200px] m-auto">
                <h2 className="text-24 text-gray-800 text-center font-semibold mb-16px">
                    Convoy Playground
                </h2>
                <p className="text-center text-14 text-gray-500 m-auto max-w-[502px]">
                    A playground for you to receive and send out webhook events,
                    test, debug and review webhook events; just like you will
                    with Convoy.
                </p>

                <div className="relative mt-24px w-fit m-auto">
                    <div className="flex items-center gap-16px w-fit h-50px bg-white-100 rounded-8px border border-primary-50 pr-16px transition-[width] duration-500 ease-in-out">
                        <div>
                            <button
                                onClick={() =>
                                    setSubscriptionDropdownState(true)
                                }
                                className="flex items-center py-14px px-16px text-gray-600 text-14 border-r border-primary-50"
                            >
                                {activeSubscription?.name}
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
                        <div className="flex items-center py-14px">
                            <span className="text-gray-600 text-14 mr-10px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                {activeSubscription?.source_metadata?.url}
                            </span>
                            <button
                                onClick={(event) =>
                                    copyToClipboard(
                                        event,
                                        activeSubscription?.source_metadata?.url
                                    )
                                }
                            >
                                <img
                                    src="/copy.svg"
                                    alt="copy icon"
                                    className="w-18px h-18px"
                                />
                            </button>
                        </div>
                        <img
                            src="/arrow-right.svg"
                            alt="arrow-right icon"
                            className="w-18px"
                        />
                        <div className="flex items-center justify-end">
                            {!showUrlForm && !showDestinationUrl && (
                                <button
                                    onClick={() => setUrlFormState(true)}
                                    className="text-12 text-gray-600 rounded-8px py-6px px-12px border border-primary-50"
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
                                        className="ml-auto"
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
                                    <p className="text-gray-500 text-14 mr-16px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                        {destinationUrl}
                                    </p>

                                    <button
                                        onClick={() => {
                                            setUrlFormState(true);
                                            setShowDestinationUrl(false);
                                        }}
                                        className="ml-auto"
                                    >
                                        <img
                                            src="/edit.svg"
                                            alt="edit icon"
                                            className="w-18px h-18px"
                                        />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {showSubscriptionDropdown && subscriptions.length && (
                        <div className="transition-all ease-in-out duration-300 absolute top-[110%] max-w-[560px] w-full bg-white-100 border border-primary-25 rounded-4px shadow-default z-10 h-fit max-h-[100px]">
                            {subscriptions.map((item) => (
                                <div
                                    key={item.uid}
                                    className="flex items-center px-14px py-10px"
                                >
                                    <div className="relative group w-fit h-fit border-0">
                                        <input
                                            id={item.uid}
                                            type="radio"
                                            value={item.uid}
                                            checked={
                                                activeSubscription?.uid ===
                                                item.uid
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
                                            for={item.uid}
                                            className="flex items-center "
                                        >
                                            <div className="rounded-4px group-focus:shadow-focus--primary group-hover:shadow-focus--primary">
                                                <div
                                                    className={`border border-primary-400 rounded-4px h-12px w-12px group-hover:bg-primary-25 transition-all duration-200 ${
                                                        activeSubscription?.uid ===
                                                            item ??
                                                        "bg-primary-25"
                                                    }`}
                                                >
                                                    {activeSubscription?.uid ===
                                                        item.uid && (
                                                        <img
                                                            src="/checkmark-primary.svg"
                                                            alt="checkmark icon"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-14 text-gray-600 px-10px  border-r border-primary-25">
                                                {item.name}
                                            </p>
                                        </label>
                                    </div>

                                    <p className="text-12 text-gray-600 pl-10px max-w-[181px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                        {
                                            activeSubscription?.source_metadata
                                                ?.url
                                        }
                                    </p>
                                    <img
                                        src="/arrow-right.svg"
                                        alt="arrow-right icon"
                                        className="mx-10px"
                                    />
                                    <p className="text-12 text-gray-600 max-w-[138px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                        {
                                            activeSubscription
                                                ?.endpoint_metadata?.target_url
                                        }
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {fetchingEventDeliveries && (
                    <div className="flex desktop:flex-wrap mb-200px mt-40px">
                        <div className="min-h-[70vh] w-full">
                            <div className="w-full border-b border-gray-200">
                                <div className="flex items-center border-b border-t border-gray-200 py-10px px-16px">
                                    <div className="w-2/5 text-12 text-gray-400">
                                        <div className="rounded-24px bg-gray-100 animate-pulse h-24px mb-24px"></div>
                                    </div>
                                    <div className="w-3/5"></div>
                                </div>
                                {tableIndex.map((item) => (
                                    <div
                                        className="flex items-center p-16px"
                                        key={item}
                                    >
                                        <div className="w-1/5">
                                            <div className="rounded-24px bg-gray-100 animate-pulse h-24px"></div>
                                        </div>
                                        <div className="w-1/2">
                                            <div className="rounded-24px bg-gray-100 animate-pulse h-24px"></div>
                                        </div>
                                        <div className="w-1/5 ml-auto flex items-center justify-around">
                                            <div className="rounded-24px bg-gray-100 animate-pulse h-24px w-150px"></div>
                                            <div className="rounded-24px bg-gray-100 animate-pulse h-24px w-30px ml-16px"></div>
                                            <div className="rounded-24px bg-gray-100 animate-pulse h-24px w-30px ml-16px"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* empty state  */}
                {!fetchingEventDeliveries &&
                    displayedEventDeliveries?.length === 0 && (
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

                {/* event delivery table  */}
                {!fetchingEventDeliveries &&
                    displayedEventDeliveries?.length > 0 && (
                        <div className="flex desktop:flex-wrap mb-200px mt-40px">
                            <div className="min-w-[660px] mr-16px desktop:mr-0 w-full  overflow-hidden rounded-8px bg-white-100 border border-primary-25">
                                <div className="min-h-[70vh]">
                                    <div className="w-full border-b border-gray-200">
                                        {displayedEventDeliveries.map(
                                            (eventDelivery) => (
                                                <div key={eventDelivery?.date}>
                                                    <div className="flex items-center border-b border-t border-gray-200 py-10px px-16px">
                                                        <div className="w-2/5 text-12 text-gray-400">
                                                            {formatDate(
                                                                eventDelivery?.date
                                                            )}
                                                        </div>
                                                        <div className="w-3/5"></div>
                                                    </div>
                                                    {eventDelivery?.content.map(
                                                        (item, index) => (
                                                            <div
                                                                id={
                                                                    "eventDelivery" +
                                                                    index
                                                                }
                                                                key={index}
                                                                className="flex items-center p-16px"
                                                                onClick={() => {
                                                                    setSelectedEventDelivery(
                                                                        item
                                                                    );
                                                                    getEventDeliveryAttempt(
                                                                        item.uid
                                                                    );
                                                                }}
                                                            >
                                                                <div className="w-1/5">
                                                                    <div className="flex items-center justify-center px-12px py-2px text-14 w-fit rounded-24px bg-success-50 text-success-400">
                                                                        200{" "}
                                                                        {
                                                                            item?.status
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div className="w-1/2">
                                                                    <div className="flex items-center justify-center px-12px py-2px w-fit text-gray-600">
                                                                        <span className="text-14  max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                                            {
                                                                                item
                                                                                    ?.event_metadata
                                                                                    ?.event_type
                                                                            }
                                                                        </span>
                                                                        <button
                                                                            className="border-none bg-transparent"
                                                                            onClick={(
                                                                                event
                                                                            ) =>
                                                                                copyToClipboard(
                                                                                    event,
                                                                                    item
                                                                                        ?.event_metadata
                                                                                        ?.event_type
                                                                                )
                                                                            }
                                                                        >
                                                                            <img
                                                                                src="/copy.svg"
                                                                                alt="copy icon"
                                                                                className="ml-4px h-14px w-14px"
                                                                            />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="w-1/5 ml-auto flex items-center justify-around">
                                                                    <div className="text-14 text-gray-500">
                                                                        {formatTime(
                                                                            eventDelivery?.date
                                                                        )}
                                                                    </div>
                                                                    <button className="border-none bg-transparent">
                                                                        <img
                                                                            src="/arrow-up-right.svg"
                                                                            alt="arrow right up icon"
                                                                        />
                                                                    </button>
                                                                    <button
                                                                        className="border-none bg-transparent"
                                                                        onClick={(
                                                                            event
                                                                        ) => {
                                                                            item.status ===
                                                                            "Success"
                                                                                ? forceRetryEvent(
                                                                                      event,
                                                                                      index,
                                                                                      item.uid
                                                                                  )
                                                                                : retryEvent(
                                                                                      event,
                                                                                      index,
                                                                                      item.uid
                                                                                  );
                                                                        }}
                                                                    >
                                                                        <img
                                                                            src="/refresh.svg"
                                                                            alt="refresh icon"
                                                                        />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-16px px-10px pb-10px">
                                    <div className="flex items-center">
                                        <button className="flex items-center px-14px py-6px text-primary-400 text-14">
                                            <img
                                                src="/angle-left.svg"
                                                alt="angle right icon"
                                                className="mr-6px"
                                            />
                                            Previous
                                        </button>
                                        <div className="h-16px w-[1px] bg-primary-50 mx-24px"></div>
                                        <button className="flex items-center px-14px py-6px  text-primary-400 text-14">
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
                            <div className="max-w-[500px] w-full min-h-[70vh] rounded-8px bg-white-100 border border-primary-25">
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

                                {fetchingDeliveryAttempt && (
                                    <div className="p-16px">
                                        <h4 className="py-8px text-12 text-gray-400 mb-16px">
                                            Header
                                        </h4>
                                        <div className="rounded-24px bg-gray-100 animate-pulse h-160px mb-24px"></div>
                                        <h4 className="py-8px text-12 text-gray-400 mb-16px">
                                            Body
                                        </h4>
                                        <div className="rounded-24px bg-gray-100 animate-pulse h-160px mb-24px"></div>
                                    </div>
                                )}
                                {!fetchingDeliveryAttempt &&
                                    selectedEventDelivery &&
                                    selectedEventDeliveryAttempt && (
                                        <div>
                                            {activeTab === "request" && (
                                                <div className="p-16px">
                                                    <CodeRenderer
                                                        title="Header"
                                                        language="language-json"
                                                        code={
                                                            selectedEventDelivery.headers
                                                        }
                                                        className="mb-26px"
                                                    />
                                                    <CodeRenderer
                                                        title="Response"
                                                        language="language-json"
                                                        code={
                                                            selectedEventDeliveryAttempt.request_http_header
                                                        }
                                                        className="mb-26px"
                                                    />
                                                </div>
                                            )}
                                            {activeTab === "response" && (
                                                <div className="p-16px">
                                                    <CodeRenderer
                                                        title="Header"
                                                        language="language-json"
                                                        code={
                                                            selectedEventDeliveryAttempt.response_http_header
                                                        }
                                                    />
                                                    <CodeRenderer
                                                        title="Body"
                                                        language="language-json"
                                                        code={
                                                            selectedEventDelivery
                                                                .metadata.data
                                                        }
                                                    />
                                                </div>
                                            )}
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
