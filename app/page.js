'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CodeRenderer from './components/prism';
import Notification from './components/notification';
import General from './services/general';
import { format } from 'date-fns';
import Loader from './components/loader';

export default function Home() {
	const tabs = ['request', 'response'];
	const tableIndex = [0, 1, 2, 3, 4, 5];
	const [activeTab, setActiveTab] = useState('request');
	const [showUrlForm, setUrlFormState] = useState(false);
	const [showEditUrlForm, setShowEditUrlForm] = useState(false);
	const [destinationUrl, setDestinationUrl] = useState('');

	const [sources, setSources] = useState([]);
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
	const [selectedEndpoint, setSelectedEndpoint] = useState(null);
	const [selectedDeliveryAttempt, setSelectedDeliveryAttempt] = useState({
		request_http_header: null,
		response_http_header: null,
		response_data: null
	});

	const [showSourceDropdown, setSourceDropdownState] = useState(false);

	const [fetchingEvents, setFetchingEvents] = useState(false);
	const [fetchingSources, setFetchingSources] = useState(true);
	const [addingSource, setAddingSource] = useState(false);
	const [retryingEvents, setRetryingEvents] = useState(false);
	const [fetchingDeliveryAttempt, setFetchingDeliveryAttempt] = useState(false);
	const [addingDestinationUrl, setAddingDestinationUrl] = useState(false);
	const [sourceErrorState, setSourceErrorState] = useState(false);
	const [eventsErrorState, setEventsErrorState] = useState(false);

	const [getEventsInterval, setGetEventsInterval] = useState(null);

	const firstTimeRender = useRef(true);
	const inputRef = useRef(null);
	const destinationInputRef = useRef(null);
	const sourceFormRef = useRef(null);
	const sourceDropdownRef = useRef(null);

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
		const dateCreateds = events?.map(item => getDate(item.created_at));
		const uniqueDateCreateds = [...new Set(dateCreateds)];
		let displayedItems = [];
		uniqueDateCreateds.forEach(itemDate => {
			const filteredItemDate = events.filter(item => getDate(item.created_at) === itemDate);
			const contents = { date: itemDate, content: filteredItemDate };
			displayedItems.push(contents);
			displayedItems = displayedItems.sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));
		});
		setDisplayedEvents(displayedItems);
	};

	const submitDestinationurl = e => {
		e.preventDefault();
		handleKeyDown();
	};

	const handleKeyDown = () => {
		const setUrl = inputRef.current?.value || destinationInputRef.current?.value;
		setDestinationUrl(setUrl);
	};

	const toggleSourceDropdown = () => {
		setSourceDropdownState(!showSourceDropdown);
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
		filterSavedSources();
	}, []);

	const checkIfActiveSourceExists = async sourcePayload => {
		if (activeSource !== null) return;
		const savedActiveSource = localStorage.getItem('PLAYGROUND_ACTIVE_SOURCE');
		if (savedActiveSource) return setActiveSources(JSON.parse(savedActiveSource));

		setActiveSources(sourcePayload[0]);
		localStorage.setItem('PLAYGROUND_ACTIVE_SOURCE', JSON.stringify(sourcePayload[0]));
	};

	const filterSavedSources = () => {
		let localSources = [];
		const _sourcesString = localStorage.getItem('PLAYGROUND_SOURCES');
		if (_sourcesString) localSources = JSON.parse(_sourcesString);
		if (localSources.length === 0) return createSource();

		setSources(localSources);
		setFetchingSources(false);
		checkIfActiveSourceExists(localSources);
	};

	// delete source
	const deleteSource = async sourceId => {
		try {
			let localSources = [];
			let localActiveSource;
			const _sourcesString = localStorage.getItem('PLAYGROUND_SOURCES');
			const _activeSourcesString = localStorage.getItem('PLAYGROUND_ACTIVE_SOURCE');
			if (_sourcesString) localSources = JSON.parse(_sourcesString);
			if (_activeSourcesString) localActiveSource = JSON.parse(_activeSourcesString);

			const sourceIndex = localSources.findIndex(source => source.uid === sourceId);
			localSources.splice(sourceIndex, 1);
			localStorage.setItem('PLAYGROUND_SOURCES', JSON.stringify(localSources));

			if (localActiveSource.uid === sourceId) {
				localStorage.setItem('PLAYGROUND_ACTIVE_SOURCE', JSON.stringify(localSources[0]));
				setActiveSources(localSources[0]);
			}

			filterSavedSources();

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

	// retry events
	const retryEvent = async ({ event, eventId, eventStatus }) => {
		event.stopPropagation();

		window.clearInterval(getEventsInterval);
		setGetEventsInterval(null);

		setRetryingEvents(true);

		const payload = { ids: [eventId] };
		try {
			eventStatus && eventStatus === 'Success'
				? await General.request({
						method: 'POST',
						url: `/eventdeliveries/forceresend`,
						body: payload
				  })
				: await General.request({
						method: 'PUT',
						url: `/eventdeliveries/${eventId}/resend`
				  });

			General.showNotification({
				message: 'Event retried successfully',
				style: 'success'
			});

			getEventsAndEventDeliveries(true).then(() => getEventsAtInterval());

			setRetryingEvents(false);
		} catch (error) {
			General.showNotification({
				message: error,
				style: 'error'
			});
			setRetryingEvents(false);

			return error;
		}
	};

	const updateActiveSource = () => {
		window.clearInterval(getEventsInterval);
		setGetEventsInterval(null);

		if (!firstTimeRender.current) localStorage.setItem('UPDATE_EVENTS', 'false');
		localStorage.removeItem('SELECTED_EVENT');

		setDisplayedEvents([]);
		setUrlFormState(false);
		setShowEditUrlForm(false);
		setDestinationUrl('');

		localStorage.setItem('PLAYGROUND_ACTIVE_SOURCE', JSON.stringify(activeSource));
		getEventsAndEventDeliveries(true).then(() => getEventsAtInterval());
	};

	const createEndpoint = async () => {
		if (destinationUrl.length === 0) return;

		const endpointPayload = {
			advanced_signatures: false,
			is_disabled: true,
			name: 'Endpoint',
			url: destinationUrl
		};

		setAddingDestinationUrl(true);
		try {
			const createEndpointResponse = await General.request({
				url: '/endpoints',
				body: endpointPayload,
				method: 'POST'
			});

			setSelectedEndpoint(createEndpointResponse.data);
		} catch (error) {
			General.showNotification({
				message: error,
				style: 'error'
			});
			setAddingDestinationUrl(false);

			return error;
		}
	};

	const editEndpoint = async () => {
		if (destinationUrl.length === 0) return;
		const editEndpointPayload = {
			advanced_signatures: activeSource?.endpoint_metadata?.advanced_signatures,
			name: activeSource?.endpoint_metadata?.title,
			url: destinationUrl
		};

		setAddingDestinationUrl(true);

		try {
			await General.request({
				url: `/endpoints/${activeSource?.endpoint_metadata?.uid}`,
				body: editEndpointPayload,
				method: 'PUT'
			});

			activeSource['destination_url'] = destinationUrl;
			setActiveSources(activeSource);

			sources.forEach(source => {
				if (source.uid === activeSource?.uid) source['destination_url'] = destinationUrl;
			});
			setSources(sources);

			General.showNotification({
				message: 'Destination Url updated successfully',
				style: 'success'
			});

			if (inputRef.current?.value) inputRef.current.value = '';
			setAddingDestinationUrl(false);
			setUrlFormState(false);
			setShowEditUrlForm(false);
		} catch (error) {
			General.showNotification({
				message: error,
				style: 'error'
			});
			setAddingDestinationUrl(false);
			return error;
		}
	};

	const createSource = async () => {
		setSourceErrorState(false);
		setAddingSource(true);

		const localSources = localStorage.getItem('PLAYGROUND_SOURCES');
		const parsedLocalSources = localSources ? JSON.parse(localSources) : [];
		const sourcePayload = {
			name: `Source${parsedLocalSources.length > 0 ? '-' + parsedLocalSources.length : ''}`,
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

			setSources([...sources, createSourceResponse.data]);
			checkIfActiveSourceExists([...sources, createSourceResponse.data]);
			setFetchingSources(false);
			setAddingSource(false);

			if (parsedLocalSources.length > 0) {
				General.showNotification({
					message: 'New source created successfully',
					style: 'success'
				});
			}

			parsedLocalSources.push(createSourceResponse.data);
			localStorage.setItem('PLAYGROUND_SOURCES', JSON.stringify(parsedLocalSources));
		} catch (error) {
			setFetchingSources(false);
			setAddingSource(false);
			if (sources.length === 0) setEventsErrorState(true);
			return error;
		}
	};

	const createSubscription = async () => {
		const subscriptionPayload = {
			disable_endpoint: true,
			endpoint_id: selectedEndpoint?.uid,
			filter_config: {
				event_types: ['*'],
				filter: {}
			},
			name: 'Playground Subscription',
			source_id: activeSource?.uid
		};
		setAddingDestinationUrl(true);

		try {
			await General.request({
				url: '/subscriptions',
				body: subscriptionPayload,
				method: 'POST'
			});

			activeSource['destination_url'] = selectedEndpoint?.target_url;
			activeSource['endpoint_metadata'] = selectedEndpoint;
			setActiveSources(activeSource);
			localStorage.setItem('PLAYGROUND_ACTIVE_SOURCE', JSON.stringify(activeSource));

			sources.forEach(source => {
				if (source.uid === activeSource?.uid) {
					source['destination_url'] = selectedEndpoint?.target_url;
					source['endpoint_metadata'] = selectedEndpoint;
				}
			});
			setSources(sources);
			localStorage.setItem('PLAYGROUND_SOURCES', JSON.stringify(sources));

			General.showNotification({
				message: 'Destination Url added successfully',
				style: 'success'
			});

			setAddingDestinationUrl(false);
			setUrlFormState(false);

			// clear form
			if (inputRef.current?.value) inputRef.current.value = '';
		} catch (error) {
			setAddingDestinationUrl(false);
			return error;
		}
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

	// handle clicking outside destination url form
	const handleClickOutside = e => {
		if (!inputRef.current?.contains(e.target)) {
			const setUrl = inputRef.current?.value;

			if (setUrl) setDestinationUrl(setUrl);
			else {
				setUrlFormState(false);
				setShowEditUrlForm(false);
			}
		}
		if (!sourceFormRef.current?.contains(e.target) && !sourceDropdownRef.current?.contains(e.target)) setSourceDropdownState(false);
	};

	useEffect(() => {
		document.addEventListener('click', handleClickOutside, true);
	}, []);

	useEffect(() => {
		if (firstTimeRender.current && !activeSource) return;
		updateActiveSource();
	}, [activeSource]);

	useEffect(() => {
		if (firstTimeRender.current && !activeSource) return;
		destinationUrl && activeSource?.destination_url ? editEndpoint() : createEndpoint();
	}, [destinationUrl]);

	useEffect(() => {
		if (selectedEndpoint) createSubscription();
	}, [selectedEndpoint]);

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
								<button onClick={() => toggleSourceDropdown()} className="flex items-center py-14px px-16px text-gray-600 text-14 border-r border-primary-50">
									{activeSource?.name}
									<img src="/angle-down.svg" alt="angle-down icon" className={`ml-28px transition-all duration-300 ease-in-out ${showSourceDropdown ? 'rotate-180' : ''}`} />
								</button>

								<div className="flex gap-24px justify-between">
									<div className="flex items-center py-14px">
										<span className="text-gray-600 text-14 mr-10px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">{activeSource?.url}</span>
										<button
											onClick={event =>
												copyToClipboard({
													event,
													textToCopy: activeSource?.url,
													notificationText: 'Source URL has been copied to clipboard.'
												})
											}>
											<img src="/copy.svg" alt="copy icon" className="w-18px h-18px" />
										</button>
									</div>
									<img src="/arrow-right.svg" alt="arrow-right icon" className="w-18px" />
									<div className="flex items-center justify-end">
										{!showUrlForm && !showEditUrlForm && !activeSource?.destination_url && (
											<button onClick={() => setUrlFormState(true)} className="text-12 text-gray-600 rounded-8px py-6px px-12px border border-primary-50 w-full">
												Add Destination
											</button>
										)}
										{(showUrlForm || showEditUrlForm) && (
											<form onSubmit={submitDestinationurl} className="flex items-center">
												<input
													type="text"
													ref={inputRef}
													className="border-none focus:outline-none focus:border-none text-14 text-black placeholder:text-gray-300 pr-10px"
													placeholder={`${activeSource?.destination_url ? 'Edit' : 'Enter'} Url`}
													readOnly={addingDestinationUrl}
													autoFocus
												/>

												{addingDestinationUrl && <div className="mini-loader ml-auto"></div>}
												{!addingDestinationUrl && (
													<button type="submit" className="border border-primary-50 rounded-4px ml-auto">
														<img src="/check.svg" alt="checkmark icon" />
													</button>
												)}
											</form>
										)}
										{!showUrlForm && !showEditUrlForm && activeSource?.destination_url && (
											<div className="flex items-center w-full">
												<p className="text-gray-500 text-14 mr-16px max-w-[211px] w-full whitespace-nowrap  overflow-hidden text-ellipsis">{activeSource?.destination_url}</p>

												<button onClick={() => setShowEditUrlForm(true)} className="ml-auto">
													<img src="/edit.svg" alt="edit icon" className="w-18px h-18px" />
												</button>
											</div>
										)}
									</div>
								</div>
							</div>

							<div
								className={`pt-8px transition-all ease-in-out duration-300 absolute top-[110%] bg-white-100 border border-primary-50 rounded-8px shadow-sm z-10 h-fit min-w-fit w-full overflow-hidden ${
									showSourceDropdown && sources.length ? 'h-[293px] opacity-100 pointer-events-auto' : 'h-0 opacity-0 pointer-events-none'
								}`}
								ref={sourceDropdownRef}>
								{sources?.map((item, index) => (
									<div key={item.uid} className="flex items-center justify-between px-12px py-12px mx-4px hover:bg-primary-25 transition-all duration-300 rounded-8px">
										<div className="flex items-center">
											<div className="relative group w-fit h-fit border-0">
												<input
													id={item?.uid}
													type="radio"
													value={item.uid}
													checked={activeSource?.uid === item.uid}
													onChange={() => {
														setActiveSources(item);
														setSourceDropdownState(false);
													}}
													className="opacity-0 absolute"
												/>
												<label htmlFor={item.uid} className="flex items-center cursor-pointer">
													<div className="rounded-4px group-focus:shadow-focus--primary group-hover:shadow-focus--primary">
														<div className={`border border-primary-400 rounded-4px h-12px w-12px group-hover:bg-primary-25 transition-all duration-200 ${activeSource?.uid === item.uid ?? 'bg-primary-25'}`}>
															{activeSource?.uid === item.uid && <img src="/checkmark-primary.svg" alt="checkmark icon" />}
														</div>
													</div>
													<p className="text-14 text-gray-600 px-10px w-94px border-r border-primary-25">{item.name}</p>
												</label>
											</div>

											<p className="text-14 text-gray-600 pl-10px max-w-[200px] w-full whitespace-nowrap  overflow-hidden text-ellipsis font-light">{item.url}</p>
											<img src="/arrow-right.svg" alt="arrow-right icon" className="mx-10px" />
											<p className={`text-14  max-w-[200px] w-full whitespace-nowrap  overflow-hidden text-ellipsis font-light ${item?.destination_url ? 'text-gray-600' : 'italic text-gray-300'}`}>
												{item?.destination_url ? item?.destination_url : `no destination set...`}
											</p>
										</div>

										{index !== 0 && (
											<button onClick={() => deleteSource(item.uid)} className="w-14px ml-16px">
												<img src="/trash.svg" />
											</button>
										)}
									</div>
								))}

								<div className="flex px-14px py-10px mt-10px border-t border-primary-50">
									<button className="flex items-center text-primary-400 text-14 px-0 disabled:opacity-50" disabled={addingSource || sources.length >= 5} onClick={() => createSource()}>
										<img src="/plus.svg" alt="plus icon" className="mr-10px" />
										{addingSource ? 'Creating New Source...' : 'New Source'}
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
													className={`flex items-center p-12px transition-all duration-300 hover:cursor-pointer hover:bg-primary-25 rounded-20px my-4px mx-8px  ${selectedEvent?.uid === item.uid ? 'bg-primary-25' : ''}`}
													onClick={() => {
														getDeliveryAttempts(true, item);
													}}>
													<div className="w-1/6">
														<div className={`flex items-center justify-center px-12px py-2px text-12 w-fit rounded-24px ${getStatusObject(item.status).class}`}>{getStatusObject(item.status).status}</div>
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
														<img src="/arrow-up-right.svg" alt="arrow right up icon" className={`block desktop:hidden ${item.status ? 'visible' : 'invisible'}`} />
														<img src="/refresh.svg" alt="refresh icon" className={`block desktop:hidden ${item.metadata?.num_trials > item.metadata?.retry_limit ? 'visible' : 'invisible'}`} />
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
								<ul className="flex flex-row m-auto w-full">
									{tabs?.map(tab => (
										<li key={tab} className="mr-24px !list-none first-of-type:ml-16px last-of-type:mr-0">
											<button className={activeTab === tab ? 'pb-12px pt-8px flex items-center active' : 'pb-12px pt-8px flex items-center'} onClick={() => setActiveTab(tab)}>
												<span className="text-12 text-left capitalize text-gray-500 tracking-[0.02em]">{tab}</span>
											</button>
										</li>
									))}
								</ul>

								<button
									disabled={retryingEvents || !selectedEvent?.delivery_uid}
									onClick={event =>
										retryEvent({
											event,
											eventId: selectedEvent?.delivery_uid,
											eventStatus: selectedEvent?.status
										})
									}
									className="flex items-center justify-center rounded-4px px-12px py-2px  bg-primary-25 text-12 text-primary-400 whitespace-nowrap disabled:opacity-50">
									<img src="/refresh-primary.svg" alt="refresh icon" className={`mr-4px ${retryingEvents ? 'animate-spin-slow' : ''}`} />
									Retry
								</button>
							</div>

							{activeTab === 'request' && selectedEvent && (
								<div className="p-16px">
									<CodeRenderer title="Header" language="language-json" code={selectedEvent?.headers} type="headers" />
									<CodeRenderer title="Body" language="language-json" code={selectedEvent?.data} />
								</div>
							)}

							{activeTab === 'response' && selectedEvent && (
								<div>
									{!selectedEvent?.status && (
										<div className="pt-34px px-16px">
											<form className="flex flex-col">
												<p className="text-gray-800 text-14 font-semibold">
													{activeSource?.destination_url ? 'Update ' : 'Add '}
													Destination
												</p>
												<p className="mt-12px text-gray-600 text-12">You can configure and endpoint to receive the webhook events injested with the provided source URL</p>

												<div className="border-t border-primary-25 my-24px"></div>
												<label htmlFor="destinationUrl" className="text-12 text-gray-400 mb-10px">
													Destination URL
												</label>
												<input
													ref={destinationInputRef}
													id="destinationUrl"
													type="text"
													className="border border-primary-25 h-46px rounded-4px text-14 px-8px placeholder:text-gray-300 focus:border-primary-400 focus:outline-none transition-all duration-300"
													placeholder="https://dashboard.getconvoy.io/webhook"
													defaultValue={activeSource?.destination_url}
													readOnly={addingDestinationUrl}
												/>
												<button
													disabled={addingDestinationUrl}
													onClick={() => {
														handleKeyDown();
													}}
													type="button"
													className="bg-primary-400 text-white-100 text-10 p-10px rounded-8px w-fit mt-24px disabled:pointer-events-none disabled:opacity-50">
													{activeSource?.destination_url ? 'Update ' : 'Add '}
													Destination
												</button>
											</form>
										</div>
									)}
									{selectedEvent?.status && (
										<div className="p-16px">
											<CodeRenderer title="Header" language="language-json" code={selectedDeliveryAttempt.response_http_header} type="headers" />

											{selectedDeliveryAttempt?.response_data && <CodeRenderer title="Body" language="language-json" code={selectedDeliveryAttempt?.response_data} />}
										</div>
									)}
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
