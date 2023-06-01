"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeRenderer from "./components/prism";
import Notification from "./components/notification";
import General from "./services/general";
import { format } from "date-fns";

import * as axios from "axios";
const _axios = axios.default;

export default function Home() {
    const tabs = ["details"];
    const tableIndex = [0, 1, 2, 3, 4, 5];
    const [activeTab, setActiveTab] = useState("details");
    const [showUrlForm, setUrlFormState] = useState(false);
    const [destinationUrl, setDestinationUrl] = useState("");

    const [sources, setSources] = useState([]);
    const [activeSource, setActiveSources] = useState(null);

    const [subscriptions, setSubscriptions] = useState([]);
    const [activeSubscription, setActiveSubscription] = useState(null);

    const [displayedEvents, setDisplayedEvents] = useState([]);
    const [eventsPagination, setEventsPagination] = useState({
        has_next_page: false,
        has_prev_page: false,
        next_page_cursor: "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
        per_page: 20,
        prev_page_cursor: "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);

    const [showSourceDropdown, setSourceDropdownState] = useState(false);

    const [fetchingEvents, setFetchingEvents] = useState(true);
    const [fetchingSources, setFetchingSources] = useState(true);
    const [retryingEvents, setRetryingEvents] = useState(false);

    const firstTimeRender = useRef(true);

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

    const setEventsDisplayed = (events) => {
        const dateCreateds = events.map((item) => getDate(item.created_at));
        const uniqueDateCreateds = [...new Set(dateCreateds)];
        let displayedItems = [];
        uniqueDateCreateds.forEach((itemDate) => {
            const filteredItemDate = events.filter(
                (item) => getDate(item.created_at) === itemDate
            );
            const contents = { date: itemDate, content: filteredItemDate };
            displayedItems.push(contents);
            displayedItems = displayedItems.sort(
                (a, b) => Number(new Date(b.date)) - Number(new Date(a.date))
            );
        });
        setDisplayedEvents(displayedItems);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            setDestinationUrl(event.target.value);
        }
    };

    // copy item to clipboard
    const copyToClipboard = ({ event, textToCopy, notificationText }) => {
        event.stopPropagation();
        if (!textToCopy) return;
        const textField = document.createElement("textarea");
        textField.innerText = textToCopy;
        document.body.appendChild(textField);
        textField.select();
        document.execCommand("copy");
        textField.remove();
        General.showNotification({ message: notificationText, style: "info" });
    };

    const createSource = async () => {
        const count = sources.length;
        const sourcePayload = {
            is_disabled: true,
            name: `Source${count > 0 ? "-" + count : ""}`,
            provider: null,
            type: "http",
            verifier: {
                noop: {},
                type: "noop",
            },
        };

        setFetchingSources(true);

        try {
            await General.request({
                url: "/sources",
                body: sourcePayload,
                method: "POST",
            });

            General.showNotification({
                message: "New source created successfully",
                style: "success",
            });
            getSources();
        } catch (error) {
            setFetchingSources(false);

            return error;
        }
    };

    const getSources = useCallback(async () => {
        setFetchingSources(true);
        try {
            const sourcesResponse = await General.request({
                url: `/sources?sort=AESC`,
            });

            if (sourcesResponse.data.content.length === 0) {
                createSource();
            } else {
                mapSourcesAndSubscriptions(sourcesResponse.data.content);
            }
        } catch (error) {
            setFetchingSources(false);

            return error;
        }
    }, []);

    // ftech subscriptions
    const getSubscriptions = useCallback(async () => {
        setFetchingSources(true);
        try {
            const subscriptionsResponse = await General.request({
                url: `/subscriptions`,
            });

            setSubscriptions(subscriptionsResponse.data.content);
            firstTimeRender.current = false;
        } catch (error) {
            setFetchingSources(false);

            return error;
        }
    }, []);

    // fetch events
    const getEvents = useCallback(async (requestDetails) => {
        let query = "";
        if (requestDetails) {
            const cleanedQuery = Object.fromEntries(
                Object.entries(requestDetails).filter(
                    ([_, q]) =>
                        q !== "" &&
                        q !== undefined &&
                        q !== null &&
                        typeof q !== "object"
                )
            );
            query = new URLSearchParams(cleanedQuery).toString();
        }

        setFetchingEvents(true);
        try {
            const eventsResponse = await General.request({
                url: `/events?sort=AESC&${query ?? query}`,
                method: "GET",
            });

            // set events for display
            setEventsDisplayed(eventsResponse.data.content);

            // set events pagination
            setEventsPagination(eventsResponse.data.pagination);

            // select first event amd set as active event
            const activeEvent = eventsResponse.data.content[0];
            setSelectedEvent(activeEvent);

            setFetchingEvents(false);
        } catch (error) {
            setFetchingEvents(false);
            return error;
        }
    }, []);

    // retry events
    const retryEvent = async ({ event, eventId }) => {
        console.log("i am being called");
        event.stopPropagation();
        setRetryingEvents(true);
        try {
            await General.request({
                method: "PUT",
                url: `/events/${eventId}/replay`,
            });

            General.showNotification({
                message: "Event retried successfully",
                style: "success",
            });

            setRetryingEvents(false);
        } catch (error) {
            General.showNotification({
                message: error,
                style: "error",
            });
            setRetryingEvents(false);

            return error;
        }
    };

    const createEndpoint = async () => {
        const endpointPayload = {
            advanced_signatures: false,
            is_disabled: true,
            name: "Endpoint",
            url: destinationUrl,
        };

        try {
            const createEndpointResponse = await General.request({
                url: "/endpoints",
                body: endpointPayload,
                method: "POST",
            });

            setSelectedEndpoint(createEndpointResponse.data);
        } catch (error) {
            return error;
        }
    };

    const findActiveSubscription = () => {};

    const mapSourcesAndSubscriptions = (sourceContent) => {
        if (subscriptions.length > 0) {
            subscriptions.forEach((subscription) => {
                sourceContent.forEach((source) => {
                    if (subscription.source_metadata.uid === source.uid)
                        source["destination_url"] =
                            subscription.endpoint_metadata.target_url;
                    else source["destination_url"] = "";
                });
            });
        }
        setSources(sourceContent);
        setActiveSources(sourceContent[0]);
        setFetchingSources(false);
    };

    const editEndpoint = async () => {
        const editEndpointPayload = {
            ...activeSubscription.endpoint_metadata,
            url: destinationUrl,
            name: activeSubscription.endpoint_metadata.title,
        };

        try {
            await General.request({
                url: `/endpoints/${activeSubscription.endpoint_metadata.uid}`,
                data: editEndpointPayload,
                method: "PUT",
            });
        } catch (error) {
            return error;
        }
    };

    const createSubscription = async () => {
        const subscriptionPayload = {
            disable_endpoint: true,
            endpoint_id: selectedEndpoint?.uid,
            filter_config: {
                event_types: ["*"],
                filter: {},
            },
            name: "Subscription",
            source_id: activeSource?.uid,
        };

        try {
            await General.request({
                url: "/subscriptions",
                data: subscriptionPayload,
                method: "POST",
            });

            General.showNotification({
                message: "Destination Url added successfully",
                style: "success",
            });

            setUrlFormState(false);
            getSubscriptions();
        } catch (error) {
            return error;
        }
    };

    const paginateEvents = ({
        direction,
        next_page_cursor,
        prev_page_cursor,
    }) => {
        getEvents({
            direction,
            next_page_cursor,
            prev_page_cursor,
        });
    };

    useEffect(() => {
        if (destinationUrl)
            activeSource?.destination_url ? editEndpoint() : createEndpoint();
    }, [destinationUrl]);

    useEffect(() => {
        if (selectedEndpoint) createSubscription();
    }, [selectedEndpoint]);

    useEffect(() => {
        // if (firstTimeRender.current) return;
        getSources();
    }, [subscriptions]);

    useEffect(() => {
        getEvents();
    }, [getEvents]);

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
                {/* sources/endpoints loader  */}
                {fetchingSources && (
                    <div className="bg-white-100 rounded-8px border border-primary-50 px-16px flex items-center flex-row gap-16px mt-24px w-fit m-auto h-50px">
                        <div className="flex items-center border-r border-primary-50 pr-16px">
                            <div className="rounded-24px bg-gray-100 animate-pulse w-120px h-24px mr-20px"></div>
                            <img src="/angle-down.svg" alt="angle-down icon" />
                        </div>
                        <div className="flex items-center">
                            <div className="rounded-24px bg-gray-100 animate-pulse w-200px h-24px mr-28px"></div>
                            <img
                                src="/copy.svg"
                                alt="copy icon"
                                className="w-18px h-18px"
                            />
                        </div>

                        <div className="rounded-24px bg-gray-100 animate-pulse w-160px h-24px"></div>
                    </div>
                )}

                {/* sources/endpoints filter/form */}
                {!fetchingSources && (
                    <div className="relative mt-24px w-fit m-auto">
                        <div className="flex items-center gap-16px w-fit h-50px bg-white-100 rounded-8px border border-primary-50 pr-16px transition-[width] duration-500 ease-in-out">
                            <div>
                                <button
                                    onClick={() => setSourceDropdownState(true)}
                                    className="flex items-center py-14px px-16px text-gray-600 text-14 border-r border-primary-50"
                                >
                                    {activeSource?.name}
                                    <img
                                        src="/angle-down.svg"
                                        alt="angle-down icon"
                                        className={`ml-28px transition-all duration-300 ease-in-out ${
                                            showSourceDropdown
                                                ? "rotate-180"
                                                : ""
                                        }`}
                                    />
                                </button>
                            </div>
                            <div className="flex items-center py-14px">
                                <span className="text-gray-600 text-14 mr-10px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                    {activeSource?.url}
                                </span>
                                <button
                                    onClick={(event) =>
                                        copyToClipboard({
                                            event,
                                            textToCopy: activeSource?.url,
                                            notificationText:
                                                "Source URL has been copied to clipboard.",
                                        })
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
                                {!showUrlForm &&
                                    !activeSource?.destination_url && (
                                        <button
                                            onClick={() =>
                                                setUrlFormState(true)
                                            }
                                            className="text-12 text-gray-600 rounded-8px py-6px px-12px border border-primary-50"
                                        >
                                            Add Destination
                                        </button>
                                    )}
                                {showUrlForm &&
                                    !activeSource?.destination_url && (
                                        <div className="flex items-center">
                                            <input
                                                type="text"
                                                className="border-none focus:outline-none focus:border-none text-14 text-black placeholder:text-gray-100 pr-10px"
                                                placeholder={`${
                                                    activeSource?.destination_url
                                                        ? "Edit"
                                                        : "Enter"
                                                } Url`}
                                                onKeyDown={handleKeyDown}
                                            />
                                            <button
                                                disabled={!destinationUrl}
                                                onClick={() => createEndpoint()}
                                                className="ml-auto"
                                            >
                                                <img
                                                    src="/check.svg"
                                                    alt="checkmark icon"
                                                />
                                            </button>
                                        </div>
                                    )}
                                {!showUrlForm &&
                                    activeSource?.destination_url && (
                                        <div className="flex items-center w-full">
                                            <p className="text-gray-500 text-14 mr-16px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                                {activeSource?.destination_url}
                                            </p>

                                            <button
                                                onClick={() => {
                                                    setUrlFormState(true);
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
                        {showSourceDropdown && sources.length && (
                            <div className="transition-all ease-in-out duration-300 absolute top-[110%] max-w-[560px] w-full bg-white-100 border border-primary-25 rounded-4px shadow-default z-10 h-fit">
                                {sources.map((item) => (
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
                                                    activeSource?.uid ===
                                                    item.uid
                                                }
                                                onChange={() => {
                                                    setActiveSources(item);
                                                    setSourceDropdownState(
                                                        false
                                                    );
                                                }}
                                                className="opacity-0 absolute"
                                            />
                                            <label
                                                htmlFor={item.uid}
                                                className="flex items-center "
                                            >
                                                <div className="rounded-4px group-focus:shadow-focus--primary group-hover:shadow-focus--primary">
                                                    <div
                                                        className={`border border-primary-400 rounded-4px h-12px w-12px group-hover:bg-primary-25 transition-all duration-200 ${
                                                            activeSource?.uid ===
                                                                item.uid ??
                                                            "bg-primary-25"
                                                        }`}
                                                    >
                                                        {activeSource?.uid ===
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
                                            {item.url}
                                        </p>
                                        <img
                                            src="/arrow-right.svg"
                                            alt="arrow-right icon"
                                            className="mx-10px"
                                        />
                                        <p
                                            className={`text-12  max-w-[153px] w-full whitespace-nowrap  overflow-hidden text-ellipsis ${
                                                item?.destination_url
                                                    ? "text-gray-600"
                                                    : "italic text-gray-300"
                                            }`}
                                        >
                                            {item?.destination_url
                                                ? item?.destination_url
                                                : `no destination set...`}
                                        </p>
                                    </div>
                                ))}

                                <div className="flex px-14px py-10px mt-10px border-t border-primary-50">
                                    <button
                                        className="flex items-center text-primary-400 text-14 px-0"
                                        onClick={() => createSource()}
                                    >
                                        <img
                                            src="/plus.svg"
                                            alt="plus icon"
                                            className="mr-10px"
                                        />
                                        New Source
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* empty state  */}
                {!fetchingEvents && displayedEvents?.length === 0 && (
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

                {/* events table  */}
                <div className="flex desktop:flex-wrap mb-200px mt-40px">
                    {/* table loader */}
                    {fetchingEvents && (
                        <div className="min-w-[660px] mr-16px desktop:mr-0 w-full  overflow-hidden rounded-8px bg-white-100 border border-primary-25">
                            <div className="min-h-[70vh] w-full">
                                <div className="w-full border-b border-gray-200">
                                    <div className="flex items-center border-b border-t border-gray-200 py-10px px-16px">
                                        <div className="w-2/5 text-12 text-gray-400">
                                            <div className="rounded-24px bg-gray-100 animate-pulse h-24px"></div>
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

                    {!fetchingEvents && displayedEvents?.length > 0 && (
                        <div className="min-w-[660px] mr-16px desktop:mr-0 w-full  overflow-hidden rounded-8px bg-white-100 border border-primary-25">
                            <div className="min-h-[70vh]">
                                <div className="w-full border-b border-gray-200">
                                    {displayedEvents.map((event) => (
                                        <div key={event?.date}>
                                            <div className="flex items-center border-b border-t border-gray-200 py-10px px-16px">
                                                <div className="w-2/5 text-12 text-gray-400">
                                                    {formatDate(event?.date)}
                                                </div>
                                                <div className="w-3/5"></div>
                                            </div>
                                            {event?.content.map(
                                                (item, index) => (
                                                    <div
                                                        id={"event" + index}
                                                        key={index}
                                                        className={`flex items-center p-16px ${
                                                            selectedEvent.uid ===
                                                            item.uid
                                                                ? "bg-primary-25"
                                                                : ""
                                                        }`}
                                                        onClick={() => {
                                                            setSelectedEvent(
                                                                item
                                                            );
                                                        }}
                                                    >
                                                        <div className="w-1/5">
                                                            {
                                                                item
                                                                    ?.source_metadata
                                                                    ?.name
                                                            }
                                                        </div>
                                                        <div className="w-1/2">
                                                            <div className="flex items-center justify-center px-12px py-2px w-fit text-gray-600">
                                                                <span className="text-14  max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
                                                                    {
                                                                        item?.event_type
                                                                    }
                                                                </span>
                                                                <button
                                                                    className="border-none bg-transparent"
                                                                    onClick={(
                                                                        event
                                                                    ) =>
                                                                        copyToClipboard(
                                                                            {
                                                                                event,
                                                                                textToCopy:
                                                                                    item?.event_type,
                                                                                notificationText:
                                                                                    "Event ID has been copied to clipboard.",
                                                                            }
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
                                                                    item?.created_at
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
                                                                disabled={
                                                                    retryingEvents
                                                                }
                                                                onClick={(
                                                                    event
                                                                ) =>
                                                                    retryEvent({
                                                                        event,
                                                                        eventId:
                                                                            item.uid,
                                                                    })
                                                                }
                                                            >
                                                                <img
                                                                    src="/refresh.svg"
                                                                    alt="refresh icon"
                                                                    className={
                                                                        retryingEvents
                                                                            ? "animate-spin-slow"
                                                                            : ""
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-16px px-10px pb-10px">
                                {(eventsPagination.has_next_page ||
                                    eventsPagination.has_prev_page) && (
                                    <div className="flex items-center">
                                        <button
                                            className="flex items-center px-14px py-6px text-primary-400 text-14 disabled:opacity-50"
                                            disabled={
                                                !eventsPagination.has_prev_page
                                            }
                                            onClick={() =>
                                                paginateEvents({
                                                    direction: "next",
                                                    next_page_cursor: "",
                                                    prev_page_cursor:
                                                        eventsPagination.prev_page_cursor,
                                                })
                                            }
                                        >
                                            <img
                                                src="/angle-left.svg"
                                                alt="angle right icon"
                                                className="mr-6px"
                                            />
                                            Previous
                                        </button>
                                        <div className="h-16px w-[1px] bg-primary-50 mx-24px"></div>
                                        <button
                                            className="flex items-center px-14px py-6px  text-primary-400 text-14 disabled:opacity-50"
                                            disabled={
                                                !eventsPagination.has_next_page
                                            }
                                            onClick={() =>
                                                paginateEvents({
                                                    direction: "prev",
                                                    next_page_cursor:
                                                        eventsPagination.next_page_cursor,
                                                    prev_page_cursor: "",
                                                })
                                            }
                                        >
                                            Next
                                            <img
                                                src="/angle-right.svg"
                                                alt="angle left icon"
                                                className="ml-6px"
                                            />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* details loader */}
                    {fetchingEvents && (
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
                        </div>
                    )}

                    {!fetchingEvents && displayedEvents?.length > 0 && (
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

                                <button
                                    disabled={retryingEvents}
                                    onClick={(event) =>
                                        retryEvent({
                                            event,
                                            eventId: selectedEvent.uid,
                                        })
                                    }
                                    className="flex items-center rounded-4px pl-10px pr-16px py-2px mr-16px bg-primary-25 text-12 text-primary-400 disabled:opacity-50"
                                >
                                    <img
                                        src="/refresh-primary.svg"
                                        alt="refresh icon"
                                        className={`mr-4px ${
                                            retryingEvents ??
                                            "animate-spin-slow"
                                        }`}
                                    />
                                    Retry
                                </button>
                            </div>

                            <div className="p-16px">
                                <CodeRenderer
                                    title="Header"
                                    language="language-json"
                                    code={selectedEvent.headers}
                                />
                                <CodeRenderer
                                    title="Response"
                                    language="language-json"
                                    code={selectedEvent.data}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showSourceDropdown && (
                <div
                    className="fixed h-screen w-screen top-0 right-0 bottom-0 z-[5]"
                    onClick={() => setSourceDropdownState(false)}
                ></div>
            )}

            <Notification></Notification>
        </React.Fragment>
    );
}
