"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import CodeRenderer from "./components/prism";
import Notification from "./components/notification";
import General from "./services/general";
import { format } from "date-fns";

export default function Home() {
    const tabs = ["request", "response"];
    const tableIndex = [0, 1, 2, 3, 4, 5];
    const [activeTab, setActiveTab] = useState("request");
    const [showUrlForm, setUrlFormState] = useState(false);
    const [showEditUrlForm, setShowEditUrlForm] = useState(false);
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

    const [eventDeliveryPagination, setEventDeliveryPagination] = useState({
        has_next_page: false,
        has_prev_page: false,
        next_page_cursor: "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
        per_page: 20,
        prev_page_cursor: "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
    });
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [selectedDeliveryAttempt, setSelectedDeliveryAttempt] = useState({
        request_http_header: null,
        response_http_header: null,
        response_data: null,
    });

    const [showSourceDropdown, setSourceDropdownState] = useState(false);

    const [fetchingEvents, setFetchingEvents] = useState(true);
    const [fetchingSources, setFetchingSources] = useState(true);
    const [retryingEvents, setRetryingEvents] = useState(false);
    const [fetchingDeliveryAttempt, setFetchingDeliveryAttempt] =
        useState(false);
    const [addingDestinationUrl, setAddingDestinationUrl] = useState(false);
    const [sourceErrorState, setSourceErrorState] = useState(false);
    const [eventsErrorState, setEventsErrorState] = useState(false);

    const firstTimeRender = useRef(true);
    const inputRef = useRef(null);

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
        if (event?.key === "Enter") {
            setDestinationUrl(event.target.value);
            return;
        }
        const setUrl = inputRef.current.value;
        setDestinationUrl(setUrl);
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

    const getSources = async () => {
        setSourceErrorState(false);
        setFetchingSources(true);
        try {
            const sourcesResponse = await General.request({
                url: `/sources?sort=AESC`,
            });
            const sourcePayload = sourcesResponse.data.content;
            return sourcePayload;
        } catch (error) {
            setFetchingSources(false);
            setSourceErrorState(true);
            return error;
        }
    };

    // ftech subscriptions
    const getSubscriptions = async () => {
        setEventsErrorState(false);
        setFetchingSources(true);
        try {
            const subscriptionsResponse = await General.request({
                url: `/subscriptions`,
            });

            const subscriptionPayload = subscriptionsResponse.data.content;
            return subscriptionPayload;
        } catch (error) {
            setFetchingSources(false);
            setSourceErrorState(true);
            if (sources.length === 0) setEventsErrorState(true);
            return error;
        }
    };

    const getSubscriptionAndSources = useCallback(async () => {
        const [subscriptionResponse, sourceResponse] = await Promise.allSettled(
            [getSubscriptions(), getSources()]
        );

        if (
            sourceResponse.status === "rejected" ||
            subscriptionResponse.status === "rejected"
        ) {
            setSourceErrorState(true);
            setEventsErrorState(true);
        }

        if (
            sourceResponse.status === "fulfilled" &&
            sourceResponse.value?.length === 0
        )
            createSource();

        if (
            sourceResponse.value?.length > 0 &&
            subscriptionResponse.value?.length > 0
        )
            mapSourcesAndSubscriptions(
                sourceResponse.value,
                subscriptionResponse.value
            );

        if (
            sourceResponse.value?.length > 0 &&
            subscriptionResponse.value?.length === 0
        )
            setSources(subscriptionResponse.value);
    }, []);

    const mapSourcesAndSubscriptions = (sourceContent, subscriptionContent) => {
        let sourcePayload = sourceContent;
        sourcePayload.forEach((source) => {
            const sourceDestinationUrl = subscriptionContent.find(
                (sub) => sub.source_metadata.uid === source.uid
            )?.endpoint_metadata.target_url;

            source["destination_url"] = sourceDestinationUrl || null;
        });
        setSources(sourcePayload);
        if (!activeSource) setActiveSources(sourceContent[0]);
        setSubscriptions(subscriptionContent);
        setFetchingSources(false);
    };

    // fetch events
    const getEvents = async (eventQuery) => {
        setEventsErrorState(false);

        setFetchingEvents(true);
        try {
            const eventsResponse = await General.request({
                url: `/events?sort=AESC&${eventQuery ?? eventQuery}`,
                method: "GET",
            });

            setFetchingEvents(false);

            return eventsResponse.data;
        } catch (error) {
            setFetchingEvents(false);
            setEventsErrorState(true);
            return error;
        }
    };

    const getEventDeliveries = async (eventDeliveryQuery) => {
        setEventsErrorState(false);
        setFetchingEvents(true);

        try {
            const eventsResponse = await General.request({
                url: `/eventdeliveries?sort=AESC&${
                    eventDeliveryQuery ?? eventDeliveryQuery
                }`,
                method: "GET",
            });

            const eventDeliveries = eventsResponse.data;

            return eventDeliveries;
        } catch (error) {
            setFetchingEvents(false);
            setEventsErrorState(true);
            return error;
        }
    };

    const cleanQuery = (requestDetails) => {
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
        return query;
    };

    const getEventsAndEventDeliveries = useCallback(
        async (eventsRequest, eventDeliveryRequest) => {
            // handle queries
            const eventsQuery = eventsRequest ? cleanQuery(eventsRequest) : "";
            const eventDeliveryQuery = eventDeliveryRequest
                ? cleanQuery(eventDeliveryRequest)
                : "";

            const [eventDeliveryResponse, eventResponse] =
                await Promise.allSettled([
                    getEventDeliveries(eventDeliveryQuery),
                    getEvents(eventsQuery),
                ]);

            const eventContent = eventResponse.value?.content;
            const eventDeliveryContent = eventDeliveryResponse.value?.content;

            if (eventContent?.length > 0 && eventDeliveryContent?.length > 0) {
                eventContent.forEach((event) => {
                    eventDeliveryContent.forEach((eventDel) => {
                        if (event.event_type === eventDel.event_id) {
                            event["status"] = eventDel.status || null;
                            event["metadata"] = eventDel.metadata;
                            event["delivery_uid"] = eventDel.uid;
                        }
                    });
                });
            }

            // set events for display
            setEventsDisplayed(eventContent);

            // set events pagination
            setEventsPagination(eventResponse.value?.pagination);
            setEventDeliveryPagination(eventDeliveryResponse.value?.pagination);

            // select first event amd set as active event
            const activeEvent = eventContent[0];
            getDeliveryAttempts(activeEvent);

            console.log(eventDeliveryResponse);
            console.log(eventResponse);
        },
        []
    );

    const getDeliveryAttempts = async (eventPayload) => {
        setSelectedEvent(eventPayload);

        if (!eventPayload.delivery_uid) return;

        setFetchingDeliveryAttempt(true);
        try {
            const deliveryAttemptRes = await General.request({
                method: "GET",
                url: `/eventdeliveries/${eventPayload.delivery_uid}/deliveryattempts`,
            });

            const { request_http_header, response_http_header, response_data } =
                deliveryAttemptRes.data[0];

            setSelectedDeliveryAttempt({
                request_http_header,
                response_http_header,
                response_data,
            });

            setFetchingDeliveryAttempt(false);
        } catch (error) {
            setFetchingDeliveryAttempt(false);
            return error;
        }
    };

    // retry events
    const retryEvent = async ({ event, eventId, eventStatus }) => {
        event.stopPropagation();
        setRetryingEvents(true);

        const payload = { ids: [eventId] };
        try {
            eventStatus && eventStatus === "Success"
                ? await General.request({
                      method: "POST",
                      url: `/eventdeliveries/forceresend`,
                      body: payload,
                  })
                : await General.request({
                      method: "PUT",
                      url: `/eventdeliveries/${eventId}/resend`,
                  });

            General.showNotification({
                message: "Event retried successfully",
                style: "success",
            });

            getEventsAndEventDeliveries();

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

    const findActiveSubscription = () => {
        setUrlFormState(false);
        setShowEditUrlForm(false);
        const activeSourceSubscription =
            subscriptions.find(
                (item) => item.source_metadata.uid === activeSource.uid
            ) || null;
        setActiveSubscription(activeSourceSubscription);
    };

    const createEndpoint = async () => {
        const endpointPayload = {
            advanced_signatures: false,
            is_disabled: true,
            name: "Endpoint",
            url: destinationUrl,
        };

        setAddingDestinationUrl(true);
        try {
            const createEndpointResponse = await General.request({
                url: "/endpoints",
                body: endpointPayload,
                method: "POST",
            });

            setSelectedEndpoint(createEndpointResponse.data);
        } catch (error) {
            setAddingDestinationUrl(false);

            return error;
        }
    };

    const createSource = async () => {
        setSourceErrorState(false);
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
            getSubscriptionAndSources();
        } catch (error) {
            setFetchingSources(false);
            if (sources.length === 0) setEventsErrorState(true);
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
        setAddingDestinationUrl(true);
        try {
            await General.request({
                url: "/subscriptions",
                body: subscriptionPayload,
                method: "POST",
            });

            General.showNotification({
                message: "Destination Url added successfully",
                style: "success",
            });

            setAddingDestinationUrl(false);
            setUrlFormState(false);
            getSubscriptionAndSources();
        } catch (error) {
            setAddingDestinationUrl(false);
            return error;
        }
    };

    const editSubscription = async () => {
        const editSubscriptionPayload = {
            ...activeSubscription,
            endpoint_id: selectedEndpoint?.uid,
        };

        try {
            await General.request({
                url: `/subscriptions${activeSubscription.uid}`,
                body: editSubscriptionPayload,
                method: "PUT",
            });

            General.showNotification({
                message: "Destination Url updated successfully",
                style: "success",
            });

            setAddingDestinationUrl(false);
            setUrlFormState(false);
            setShowEditUrlForm(false);
            getSubscriptionAndSources();
        } catch (error) {
            setAddingDestinationUrl(false);
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

    const setUpUser = () => {
        if (firstTimeRender.current) {
            const userId = (Math.random() + 1).toString(36).substring(2);
            console.log(userId);
            localStorage.setItem("USER_ID", userId);
            firstTimeRender.current = false;
        }
        // getSubscriptionAndSources()
    };

    const getStatusObject = (status) => {
        const statusTypes = {
            warning: "bg-warning-50 text-warning-400",
            error: "bg-danger-50 text-danger-400",
            default: "border border-gray-200 text-gray-400 bg-gray-50",
            success: "bg-success-50 text-success-400",
        };
        let statusObj = { status, class: statusTypes.default };
        switch (status) {
            case "Success":
                statusObj = {
                    status: "200 success",
                    class: statusTypes.success,
                };
                break;
            case "Pending":
                statusObj = {
                    status,
                    class: statusTypes.warning,
                };
                type = "warning";
                break;
            case "Failed":
            case "Failure":
                statusObj = {
                    status,
                    class: statusTypes.error,
                };
                break;
            default:
                statusObj = {
                    status,
                    class: statusTypes.default,
                };
                break;
        }

        return statusObj;
    };

    useEffect(() => {
        findActiveSubscription();
    }, [activeSource]);

    useEffect(() => {
        if (destinationUrl) createEndpoint();
    }, [destinationUrl]);

    useEffect(() => {
        if (selectedEndpoint) {
            activeSource?.destinationUrl
                ? editSubscription()
                : createSubscription();
        }
    }, [selectedEndpoint]);

    useEffect(() => {
        getEventsAndEventDeliveries();
    }, [getEventsAndEventDeliveries]);

    useEffect(() => {
        getSubscriptionAndSources();
    }, [getSubscriptionAndSources]);

    useEffect(() => {
        setUpUser();
    }, [setUpUser]);

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
                {!fetchingSources && !sourceErrorState && (
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
                                    !showEditUrlForm &&
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
                                {(showUrlForm || showEditUrlForm) && (
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            ref={inputRef}
                                            className="border-none focus:outline-none focus:border-none text-14 text-black placeholder:text-gray-300 pr-10px"
                                            placeholder={`${
                                                activeSource?.destination_url
                                                    ? "Edit"
                                                    : "Enter"
                                            } Url`}
                                            onKeyDown={handleKeyDown}
                                        />
                                        <button
                                            disabled={addingDestinationUrl}
                                            onClick={() => handleKeyDown()}
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
                                    !showEditUrlForm &&
                                    activeSource?.destination_url && (
                                        <div className="flex items-center w-full">
                                            <p className="text-gray-500 text-14 mr-16px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">
                                                {activeSource?.destination_url}
                                            </p>

                                            <button
                                                onClick={() => {
                                                    setShowEditUrlForm(true);
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

                        {showSourceDropdown && sources.length > 0 && (
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
                    <div className="relative max-w-[564px] m-auto">
                        <div className="w-full  rounded-12px bg-white-100 h-340px shadow-sm flex flex-col items-center justify-center mt-34px">
                            <img
                                src="/empty-state.svg"
                                alt="empty state icon"
                                className="mb-48px"
                            />

                            <p className="text-center text-14 text-gray-400 font-medium">
                                Waiting for your first event...
                            </p>
                        </div>

                        {eventsErrorState && (
                            <div className="absolute flex backdrop-blur-sm rounded-4px w-full h-340px top-0 bg-primary-100 bg-opacity-50 items-center flex-col justify-center p-24px transition-all duration-300">
                                <img
                                    src="/warning-icon-large.svg"
                                    alt="warning icon"
                                    className="mb-48px"
                                />

                                <p className="text-center text-18 font-medium">
                                    An error occured, please refresh
                                </p>
                            </div>
                        )}
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

                    {/* events list  */}
                    {!fetchingEvents && displayedEvents?.length > 0 && (
                        <div className="min-w-[660px] mr-16px desktop:mr-0 w-full  overflow-hidden rounded-8px bg-white-100 border border-primary-25">
                            <div className="min-h-[70vh]">
                                <div className="w-full border-b border-gray-200">
                                    {displayedEvents.map(
                                        (event, eventIndex) => (
                                            <div key={event.date}>
                                                <div
                                                    className={`flex items-center border-b border-gray-200 py-10px px-16px ${
                                                        eventIndex > 0
                                                            ? "border-t"
                                                            : ""
                                                    }`}
                                                >
                                                    <div className="w-2/5 text-12 text-gray-400">
                                                        {formatDate(
                                                            event?.date
                                                        )}
                                                    </div>
                                                    <div className="w-3/5"></div>
                                                </div>
                                                {event.content.map(
                                                    (item, index) => (
                                                        <div
                                                            id={"event" + index}
                                                            key={index}
                                                            className={`flex items-center p-16px hover:cursor-pointer ${
                                                                selectedEvent.uid ===
                                                                item.uid
                                                                    ? "bg-primary-25"
                                                                    : ""
                                                            }`}
                                                            onClick={() => {
                                                                getDeliveryAttempts(
                                                                    item
                                                                );
                                                            }}
                                                        >
                                                            <div className="w-1/5">
                                                                <div
                                                                    className={`flex items-center justify-center px-12px py-2px text-14 w-fit rounded-24px ${
                                                                        getStatusObject(
                                                                            item.status
                                                                        ).class
                                                                    }`}
                                                                >
                                                                    {
                                                                        getStatusObject(
                                                                            item.status
                                                                        ).status
                                                                    }
                                                                </div>
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
                                                                <img
                                                                    src="/arrow-up-right.svg"
                                                                    alt="arrow right up icon"
                                                                    className={
                                                                        item.status
                                                                            ? "visible"
                                                                            : "invisible"
                                                                    }
                                                                />
                                                                <img
                                                                    src="/refresh.svg"
                                                                    alt="refresh icon"
                                                                    className={
                                                                        item
                                                                            .metadata
                                                                            ?.num_trials >
                                                                        item
                                                                            .metadata
                                                                            ?.retry_limit
                                                                            ? "visible"
                                                                            : "invisible"
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* pagination  */}
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
                    {(fetchingEvents || fetchingDeliveryAttempt) && (
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

                                <div className="rounded-24px bg-gray-100 animate-pulse h-24px w-100px mr-16px"></div>
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

                    {/* event details  */}
                    {!fetchingEvents &&
                        !fetchingDeliveryAttempt &&
                        displayedEvents?.length > 0 && (
                            <div className="max-w-[500px] w-full min-h-[70vh] rounded-8px bg-white-100 border border-primary-25">
                                <div className="flex items-center justify-between border-b border-gray-200 pr-16px">
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
                                        disabled={
                                            retryingEvents ||
                                            !selectedEvent.delivery_uid
                                        }
                                        onClick={(event) =>
                                            retryEvent({
                                                event,
                                                eventId:
                                                    selectedEvent.delivery_uid,
                                                eventStatus:
                                                    selectedEvent.status,
                                            })
                                        }
                                        className="flex items-center justify-center rounded-4px px-12px py-2px  bg-primary-25 text-12 text-primary-400 whitespace-nowrap disabled:opacity-50"
                                    >
                                        <img
                                            src="/refresh-primary.svg"
                                            alt="refresh icon"
                                            className={`mr-4px ${
                                                retryingEvents
                                                    ? "animate-spin-slow"
                                                    : ""
                                            }`}
                                        />
                                        {selectedEvent.status &&
                                        selectedEvent.status === "Success"
                                            ? "Force "
                                            : ""}
                                        Retry
                                    </button>
                                </div>

                                {activeTab === "request" && (
                                    <div className="p-16px">
                                        <CodeRenderer
                                            title="Header"
                                            language="language-json"
                                            code={selectedEvent.headers}
                                        />
                                        <CodeRenderer
                                            title="Body"
                                            language="language-json"
                                            code={selectedEvent.data}
                                        />
                                    </div>
                                )}

                                {activeTab === "response" && (
                                    <div>
                                        {!selectedEvent.status && (
                                            <p className="p-16px italic text-gray-400 text-14">
                                                No response header or body was
                                                sent...
                                            </p>
                                        )}
                                        {selectedEvent.status && (
                                            <div className="p-16px">
                                                <CodeRenderer
                                                    title="Header"
                                                    language="language-json"
                                                    code={
                                                        selectedDeliveryAttempt.response_http_header
                                                    }
                                                />

                                                {selectedEvent.response_data && (
                                                    <CodeRenderer
                                                        title="Body"
                                                        language="language-json"
                                                        code={
                                                            selectedEvent.response_data
                                                        }
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
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
