'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CodeRenderer from '../../components/prism';
import Notification from '../../components/notification';
import General from '../../services/general';
import { format } from 'date-fns';
import Loader from '../../components/loader';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

export default function Home() {
	const tabs = ['request', 'response'];
	const [activeTab, setActiveTab] = useState('request');

	const [activeSource, setActiveSources] = useState(null);

	const [displayedEvents, setDisplayedEvents] = useState([]);
	const [eventsPagination, setEventsPagination] = useState({
		has_next_page: false,
		has_prev_page: false,
		next_page_cursor: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
		per_page: 20,
		prev_page_cursor: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
	});

	const [eventDeliveryPagination, setEventDeliveryPagination] = useState({
		has_next_page: false,
		has_prev_page: false,
		next_page_cursor: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF',
		per_page: 20,
		prev_page_cursor: 'FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF'
	});
	const [selectedEvent, setSelectedEvent] = useState(null);
	const [selectedDeliveryAttempt, setSelectedDeliveryAttempt] = useState({
		request_http_header: null,
		response_http_header: null,
		response_data: null
	});

	const [fetchingEvents, setFetchingEvents] = useState(false);
	const [fetchingSources, setFetchingSources] = useState(true);
	const [addingSource, setAddingSource] = useState(false);
	const [fetchingDeliveryAttempt, setFetchingDeliveryAttempt] = useState(false);
	const [sourceErrorState, setSourceErrorState] = useState(false);
	const [eventsErrorState, setEventsErrorState] = useState(false);

	const [getEventsInterval, setGetEventsInterval] = useState(null);

	const firstTimeRender = useRef(true);
	const sourceFormRef = useRef(null);

	const router = useRouter();
	const searchParams = useSearchParams();

	const activeSourceUid = searchParams.get('sourceId');

	const months = ['Jan', 'Feb', 'Mar', 'April', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

	const formatDate = date => {
		return format(new Date(date), 'd LLL, yyyy');
	};

	const formatTime = time => {
		return format(new Date(time), 'HH:mm:ssaaa');
	};

	const getDate = date => {
		const _date = new Date(date);
		const day = _date.getDate();
		const month = _date.getMonth();
		const year = _date.getFullYear();
		return `${day} ${months[month]}, ${year}`;
	};

	const setEventsDisplayed = events => {
		const dateCreateds = events?.map(item => getDate(item?.created_at));
		const uniqueDateCreateds = [...new Set(dateCreateds)];
		let displayedItems = [];
		uniqueDateCreateds.forEach(itemDate => {
			const filteredItemDate = events.filter(item => getDate(item?.created_at) === itemDate);
			const contents = { date: itemDate, content: filteredItemDate };
			displayedItems.push(contents);
			displayedItems = displayedItems.sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));
		});
		setDisplayedEvents(displayedItems);
	};

	// copy item to clipboard
	const copyToClipboard = ({ event, textToCopy, notificationText }) => {
		event.stopPropagation();
		if (!textToCopy) return;
		const textField = document.createElement('textarea');
		textField.innerText = textToCopy;
		document.body.appendChild(textField);
		textField.select();
		document.execCommand('copy');
		textField.remove();
		General.showNotification({ message: notificationText, style: 'info' });
	};

	const getSubscriptionAndSources = useCallback(async () => {
		setFetchingSources(true);
		if (activeSourceUid) return findSource(activeSourceUid);
		getSavedSource();
	}, []);

	const getSavedSource = () => {
		const _sourcesString = localStorage.getItem('PLAYGROUND_ACTIVE_SOURCE');
		if (_sourcesString) {
			const activeSource = JSON.parse(_sourcesString);

			setUpActiveSource(activeSource);
		} else return createSource();
	};

	// delete source
	const deleteSource = async sourceId => {
		try {
			General.request({
				url: `/sources/${activeSource ? sourceId : ''}`,
				method: 'DELETE'
			});
		} catch (error) {}
	};

	// fetch events
	const getEvents = async eventQuery => {
		setEventsErrorState(false);

		try {
			const eventsResponse = await General.request({
				url: `/events?sort=AESC${activeSource ? '&sourceId=' + activeSource.uid : ''}&${eventQuery ?? eventQuery}`,
				method: 'GET'
			});

			return eventsResponse.data;
		} catch (error) {
			setFetchingEvents(false);
			setEventsErrorState(true);
			return error;
		}
	};

	const getEventDeliveries = async eventDeliveryQuery => {
		setEventsErrorState(false);

		try {
			const eventsResponse = await General.request({
				url: `/eventdeliveries?sort=AESC${activeSource ? '&sourceId=' + activeSource.uid : ''}&${eventDeliveryQuery ?? eventDeliveryQuery}`,
				method: 'GET'
			});

			const eventDeliveries = eventsResponse.data;

			return eventDeliveries;
		} catch (error) {
			setFetchingEvents(false);
			setEventsErrorState(true);
			return error;
		}
	};

	const cleanQuery = requestDetails => {
		let query;
		const cleanedQuery = Object.fromEntries(Object.entries(requestDetails).filter(([_, q]) => q !== '' && q !== undefined && q !== null && typeof q !== 'object'));
		query = new URLSearchParams(cleanedQuery).toString();
		return query;
	};

	const getEventsAndEventDeliveries = async (showEventsLoader, eventsRequest, eventDeliveryRequest) => {
		if (showEventsLoader) setFetchingEvents(true);

		// handle queries
		const eventsQuery = eventsRequest ? cleanQuery(eventsRequest) : '';
		const eventDeliveryQuery = eventDeliveryRequest ? cleanQuery(eventDeliveryRequest) : '';

		const [eventDeliveryResponse, eventResponse] = await Promise.allSettled([getEventDeliveries(eventDeliveryQuery), getEvents(eventsQuery)]);

		const eventContent = eventResponse.value?.content;
		const eventDeliveryContent = eventDeliveryResponse.value?.content;

		if (eventContent?.length > 0 && eventDeliveryContent?.length > 0) {
			eventContent.forEach(event => {
				eventDeliveryContent.forEach(eventDel => {
					if (event.event_type === eventDel.event_id) {
						event['status'] = eventDel.status || null;
						event['metadata'] = eventDel.metadata;
						event['delivery_uid'] = eventDel.uid;
					}
				});
			});
		}

		// check if update events is set to true
		const updateEvents = localStorage.getItem('UPDATE_EVENTS');
		const shouldUpdateEvents = updateEvents ? JSON.parse(updateEvents) : false;

		if (!shouldUpdateEvents) {
			localStorage.setItem('UPDATE_EVENTS', 'true');
			setFetchingEvents(false);
			return;
		}
		// set events for display
		setEventsDisplayed(eventContent);

		// set events pagination
		setEventsPagination(eventResponse.value?.pagination);
		setEventDeliveryPagination(eventDeliveryResponse.value?.pagination);

		localStorage.setItem('UPDATE_EVENTS', 'true');

		// select first event amd set as active event
		if (eventContent?.length > 0) {
			const savedActiveEvent = localStorage.getItem('SELECTED_EVENT');
			const activeEvent = savedActiveEvent ? JSON.parse(savedActiveEvent) : eventContent[0];

			getDeliveryAttempts(showEventsLoader, activeEvent);
		}

		setTimeout(() => {
			setFetchingEvents(false);
		}, 500);
	};

	const getEventsAtInterval = () => {
		const eventsInterval = setInterval(() => {
			getEventsAndEventDeliveries();
		}, 5000);
		setGetEventsInterval(eventsInterval);
	};

	const getDeliveryAttempts = async (showLoader, eventPayload) => {
		// save selected event
		setFetchingDeliveryAttempt(false);
		localStorage.setItem('SELECTED_EVENT', JSON.stringify(eventPayload));

		setSelectedEvent(eventPayload);

		if (!eventPayload?.delivery_uid) return;
		if (showLoader) setFetchingDeliveryAttempt(true);

		try {
			const deliveryAttemptRes = await General.request({
				method: 'GET',
				url: `/eventdeliveries/${eventPayload?.delivery_uid}/deliveryattempts`
			});

			const { request_http_header, response_http_header, response_data } = deliveryAttemptRes.data[0];

			setSelectedDeliveryAttempt({
				request_http_header,
				response_http_header,
				response_data
			});

			setFetchingDeliveryAttempt(false);
		} catch (error) {
			setFetchingDeliveryAttempt(false);
			return error;
		}
	};

	const updateActiveSource = () => {
		window.clearInterval(getEventsInterval);
		setGetEventsInterval(null);

		if (!firstTimeRender.current) localStorage.setItem('UPDATE_EVENTS', 'false');
		localStorage.removeItem('SELECTED_EVENT');

		setDisplayedEvents([]);

		localStorage.setItem('PLAYGROUND_ACTIVE_SOURCE', JSON.stringify(activeSource));
		getEventsAndEventDeliveries(true).then(() => getEventsAtInterval());
	};

	const createSource = async () => {
		setSourceErrorState(false);
		setAddingSource(true);

		let currentActiveSource;

		const _sourcesString = localStorage.getItem('PLAYGROUND_ACTIVE_SOURCE');
		if (_sourcesString) currentActiveSource = JSON.parse(_sourcesString);

		const sourcePayload = {
			name: `Source`,
			provider: null,
			type: 'http',
			verifier: {
				noop: {},
				type: 'noop'
			}
		};

		try {
			const createSourceResponse = await General.request({
				url: '/sources',
				body: sourcePayload,
				method: 'POST'
			});

			setUpActiveSource(createSourceResponse.data);

			setAddingSource(false);

			General.showNotification({
				message: 'New url created successfully',
				style: 'success'
			});

			if (currentActiveSource) deleteSource(currentActiveSource.uid);
		} catch (error) {
			setFetchingSources(false);
			setAddingSource(false);
			if (!activeSource) setEventsErrorState(true);
			return error;
		}
	};

	const setUpActiveSource = sourceData => {
		setActiveSources(sourceData);
		localStorage.setItem('PLAYGROUND_ACTIVE_SOURCE', JSON.stringify(sourceData));
		router.replace(`/in/${sourceData.mask_id}`, { shallow: true });
		setFetchingSources(false);
	};

	const findSource = async uid => {
		try {
			const getSourceResponse = await General.request({
				url: `/sources/${uid}`,
				method: 'GET'
			});

			const { data } = getSourceResponse;
			setUpActiveSource(data);
		} catch {}
	};

	const paginateEvents = ({ direction, next_page_cursor, prev_page_cursor }) => {
		window.clearInterval(getEventsInterval);
		setGetEventsInterval(null);

		const eventsRequest = {
			direction,
			next_page_cursor,
			prev_page_cursor
		};

		const eventDeliveryRequest = {
			direction,
			next_page_cursor: direction === 'next' && eventDeliveryPagination.has_next_page ? eventDeliveryPagination.next_page_cursor : '',
			prev_page_cursor: direction === 'prev' && eventDeliveryPagination.has_prev_page ? eventDeliveryPagination.prev_page_cursor : ''
		};

		getEventsAndEventDeliveries(true, eventsRequest, eventDeliveryRequest);
	};

	const getStatusObject = status => {
		const statusTypes = {
			warning: 'bg-warning-50 text-warning-400',
			error: 'bg-danger-50 text-danger-400',
			default: 'border border-gray-200 text-gray-400 bg-gray-50',
			success: 'bg-success-50 text-success-400'
		};

		let statusObj = { status, class: statusTypes.default };

		switch (status) {
			case 'Success':
				statusObj = {
					status: '200 success',
					class: statusTypes.success
				};
				break;
			case 'Pending':
				statusObj = {
					status: status.toLowerCase(),
					class: statusTypes.warning
				};
				type = 'warning';
				break;
			case 'Failed':
			case 'Failure':
				statusObj = {
					status: status.toLowerCase(),
					class: statusTypes.error
				};
				break;
			default:
				statusObj = {
					status: status ? status.toLowerCase() : 'received',
					class: statusTypes.default
				};
				break;
		}

		return statusObj;
	};

	useEffect(() => {
		if (firstTimeRender.current && !activeSource) return;
		updateActiveSource();
	}, [activeSource]);

	useEffect(() => {
		getSubscriptionAndSources();
	}, [getSubscriptionAndSources]);

	// end interval on destroy
	useEffect(() => {
		return () => {
			window.clearInterval(getEventsInterval);
			setGetEventsInterval(null);
		};
	}, []);

	return (
		<React.Fragment>
			<div className="pt-160px px-20px max-w-[1500px] m-auto">
				<div className={(displayedEvents?.length == 0 ? 'h-96px' : 'h-0') + ' overflow-hidden transition-all duration-300'}>
					<h2 className="text-24 text-gray-800 text-center font-semibold mb-16px">Convoy Playground</h2>
					<p className="text-center text-14 text-gray-500 m-auto max-w-[502px]">A playground for you to receive and send out webhook events, test, debug and review webhook events; just like you will with Convoy.</p>
				</div>

				{/* sources/endpoints loader  */}
				{fetchingSources && (
					<div className="bg-white-100 rounded-8px border border-primary-50 px-16px flex items-center flex-row gap-16px mb-40px mt-24px w-fit m-auto h-50px">
						<div className="flex items-center border-r border-primary-50 pr-16px">
							<div className="rounded-24px bg-gray-100 animate-pulse w-120px h-24px mr-20px"></div>
							<img src="/angle-down.svg" alt="angle-down icon" />
						</div>
						<div className="flex items-center">
							<div className="rounded-24px bg-gray-100 animate-pulse w-200px h-24px mr-28px"></div>
							<img src="/copy.svg" alt="copy icon" className="w-18px h-18px" />
						</div>

						<div className="rounded-24px bg-gray-100 animate-pulse w-160px h-24px"></div>
					</div>
				)}

				{/* sources/endpoints filter/form */}
				{!fetchingSources && !sourceErrorState && (
					<div className="sticky top-100px bg-[#fafafe] pt-14px pb-40px z-50">
						<div className="relative mt-24px max-w-[720px] w-fit mx-auto">
							<div ref={sourceFormRef} className="flex items-center gap-16px bg-white-100 rounded-8px border border-primary-50 pr-16px shadow-sm transition-all duration-300 m-auto w-fit">
								<div className="flex items-center py-14px px-16px text-gray-600 text-14 border-r border-primary-50">URL</div>

								<div className="flex gap-24px justify-between">
									<div className="flex items-center py-14px">
										<span className="text-gray-600 text-14 mr-10px max-w-[440px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">https://{activeSource?.url}</span>
										<button
											onClick={event =>
												copyToClipboard({
													event,
													textToCopy: `https://${activeSource?.url}`,
													notificationText: 'Source URL has been copied to clipboard.'
												})
											}>
											<img src="/copy.svg" alt="copy icon" className="w-18px h-18px" />
										</button>
									</div>
									<button className="flex items-center gap-8px text-primary-400 text-14 px-16px disabled:opacity-50 border-l border-primary-50" disabled={addingSource} onClick={() => createSource()}>
										<img src="/plus.svg" alt="plus icon" />
										{addingSource ? 'Creating...' : 'New'}
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* empty state */}
				{!fetchingEvents && displayedEvents?.length === 0 && (
					<div className="relative max-w-[1200px] m-auto h-[44vh] flex flex-col items-center justify-center rounded-12px bg-white-100 shadow-sm border border-primary-25">
						{!eventsErrorState && (
							<>
								<img src="/empty-state.svg" alt="empty state icon" className="mb-48px" />
								<p className="text-center text-14 text-gray-400 font-medium">Waiting for your first event...</p>
							</>
						)}

						{eventsErrorState && (
							<>
								<img src="/warning-icon-large.svg" alt="warning icon" className="mb-24px" />
								<p className="text-center text-14">An error occured, please refresh</p>
							</>
						)}
					</div>
				)}

				{/* events table  */}
				<div className="flex mb-200px">
					{/* table loader */}
					{fetchingEvents && (
						<div className="min-h-[44vh] relative w-full">
							<Loader className="absolute rounded-12px shadow-sm border border-primary-25"></Loader>
						</div>
					)}

					{/* events list  */}
					{!fetchingEvents && displayedEvents?.length > 0 && (
						<div className="max-w-[960px] mr-16px desktop:mr-0 w-full  overflow-hidden rounded-8px bg-white-100 border border-primary-25">
							<div className="min-h-[70vh]">
								<div className="w-full border-b border-gray-200">
									{displayedEvents?.map((event, eventIndex) => (
										<div key={event.date}>
											<div className={`flex items-center border-b border-gray-200 py-10px px-20px ${eventIndex > 0 ? 'border-t' : ''}`}>
												<div className="w-2/5 text-12 text-gray-400">{formatDate(event?.date)}</div>
												<div className="w-3/5"></div>
											</div>
											{event.content?.map((item, index) => (
												<div
													id={'event' + index}
													key={index}
													className={`flex items-center p-12px transition-all duration-300 hover:cursor-pointer hover:bg-primary-25 rounded-20px my-4px mx-8px  ${selectedEvent?.uid === item?.uid ? 'bg-primary-25' : ''}`}
													onClick={() => {
														getDeliveryAttempts(true, item);
													}}>
													<div className="w-1/6">
														<div className={`flex items-center justify-center px-12px py-2px text-12 w-fit rounded-24px ${getStatusObject(item?.status).class}`}>{getStatusObject(item?.status).status}</div>
													</div>
													<div className="w-1/2">
														<div className="flex items-center justify-center px-12px py-2px w-fit text-gray-600">
															<span className="text-12 max-w-[300px] desktop:max-w-[120px] whitespace-nowrap overflow-hidden text-ellipsis">{item?.event_type}</span>
															<button
																className="border-none bg-transparent"
																onClick={event =>
																	copyToClipboard({
																		event,
																		textToCopy: item?.event_type,
																		notificationText: 'Event ID has been copied to clipboard.'
																	})
																}>
																<img src="/copy.svg" alt="copy icon" className="ml-4px h-14px w-14px" />
															</button>
														</div>
													</div>
													<div className="w-1/5 ml-auto flex items-center justify-around">
														<div className="text-12 text-gray-500">{formatTime(item?.created_at)}</div>
														<img src="/arrow-up-right.svg" alt="arrow right up icon" className={`block desktop:hidden ${item?.status ? 'visible' : 'invisible'}`} />
														<img src="/refresh.svg" alt="refresh icon" className={`block desktop:hidden ${item?.metadata?.num_trials > item?.metadata?.retry_limit ? 'visible' : 'invisible'}`} />
													</div>
												</div>
											))}
										</div>
									))}
								</div>
							</div>

							{/* pagination  */}
							<div className="flex items-center justify-between mt-16px px-10px pb-10px">
								{(eventsPagination.has_next_page || eventsPagination.has_prev_page) && (
									<div className="flex items-center">
										<button
											className="flex items-center px-14px py-6px text-primary-400 text-14 disabled:opacity-50"
											disabled={!eventsPagination.has_prev_page}
											onClick={() =>
												paginateEvents({
													direction: 'prev',
													next_page_cursor: '',
													prev_page_cursor: eventsPagination.prev_page_cursor
												})
											}>
											<img src="/angle-left.svg" alt="angle right icon" className="mr-6px" />
											Previous
										</button>
										<div className="h-16px w-[1px] bg-primary-50 mx-24px"></div>
										<button
											className="flex items-center px-14px py-6px  text-primary-400 text-14 disabled:opacity-50"
											disabled={!eventsPagination.has_next_page}
											onClick={() =>
												paginateEvents({
													direction: 'next',
													next_page_cursor: eventsPagination.next_page_cursor,
													prev_page_cursor: ''
												})
											}>
											Next
											<img src="/angle-right.svg" alt="angle left icon" className="ml-6px" />
										</button>
									</div>
								)}
							</div>
						</div>
					)}

					{/* details loader */}
					{fetchingDeliveryAttempt && (
						<div className="max-w-[500px] w-full min-h-[70vh] rounded-8px bg-white-100 border border-primary-25">
							<div className="flex items-center justify-between border-b border-gray-200">
								<ul className="flex flex-row m-auto w-full">
									{tabs?.map(tab => (
										<li key={tab} className="mr-24px !list-none first-of-type:ml-16px last-of-type:mr-0">
											<button className={activeTab === tab ? 'pb-12px pt-8px flex items-center active' : 'pb-12px pt-8px flex items-center'} onClick={() => setActiveTab(tab)}>
												<span className="text-12 text-left capitalize text-gray-500 tracking-[0.02em]">{tab}</span>
											</button>
										</li>
									))}
								</ul>

								<div className="rounded-24px bg-gray-100 animate-pulse h-24px w-100px mr-16px"></div>
							</div>
							<div className="p-16px">
								<h4 className="py-8px text-12 text-gray-400 mb-16px">Header</h4>
								<div className="rounded-24px bg-gray-100 animate-pulse h-160px mb-24px"></div>
								<h4 className="py-8px text-12 text-gray-400 mb-16px">Body</h4>
								<div className="rounded-24px bg-gray-100 animate-pulse h-160px mb-24px"></div>
							</div>
						</div>
					)}

					{/* event details  */}
					{!fetchingEvents && !fetchingDeliveryAttempt && displayedEvents?.length > 0 && (
						<div className="max-w-[500px] w-full min-h-[70vh] rounded-8px bg-white-100 border border-primary-25">
							<div className="flex items-center justify-between border-b border-gray-200 pr-16px">
								<h4 className="pb-12px pt-8px px-16px text-12 text-left capitalize text-gray-500 tracking-[0.02em]">Request</h4>
							</div>

							{selectedEvent && (
								<div className="p-16px">
									<CodeRenderer title="Header" language="language-json" code={selectedEvent?.headers} type="headers" />
									<CodeRenderer title="Body" language="language-json" code={selectedEvent?.data} />
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{fetchingSources && <Loader className="z-[70]"></Loader>}

			<Notification></Notification>
		</React.Fragment>
	);
}
