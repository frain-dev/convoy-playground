"use client";
import { useState } from "react";

export default function Home() {
  const tabs = ["request", "response"];
  const subscriptions = ["Subscription A", "Subscription B"];
  const showEvents = false;
  const [activeTab, setActiveTab] = useState("request");
  const [showUrlForm, setUrlFormState] = useState(false);
  const [showSubscriptionDropdown, setSubscriptionDropdownState] =
    useState(false);
  const [activeSubscription, setActiveSubscription] =
    useState("Subscription A");

  return (
    <div className="pt-60px max-w-[974px] m-auto">
      <h2 className="text-18 text-center font-semibold">Convoy Playground</h2>
      <p className="text-center text-12 text-gray-500 m-auto max-w-[460px]">
        A playground for you to receive and send out webhook events, test, debug
        and review webhook events; just like you will with Convoy{" "}
      </p>

      <div className="relative mt-24px max-w-[625px] w-full m-auto bg-gray-25 rounded-4px border border-gray-200">
        <div className="flex items-center w-full h-46px">
          <div>
            <button
              onClick={() => setSubscriptionDropdownState(true)}
              className="flex items-center py-14px px-16px text-gray-500 text-14 border-r border-gray-200"
            >
              {activeSubscription}
              <img
                src="/angle-down.svg"
                alt="angle-down icon"
                className="ml-6px"
              />
            </button>
          </div>
          <div className="flex items-center p-14px">
            <span className="text-gray-500 text-14 mr-16px">
              https://convoy.events/htisspsos
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
          <div className="flex items-center justify-center">
            {!showUrlForm && (
              <button
                onClick={() => setUrlFormState(true)}
                className="text-10 text-gray-400 rounded-4px py-2px px-12px border border-gray-200"
              >
                Add Destination
              </button>
            )}
            {showUrlForm && (
              <input
                type="text"
                className="border-none focus:outline-none focus:border-none text-14 text-black placeholder:text-gray-100"
                placeholder="Enter Url"
              />
            )}
            {/* <span>https://convoy.com/hti...</span> */}
            {/* <button className="border border-gray-200 rounded-4px p-2px">
              <img src="/edit.svg" alt="edit icon" />
            </button> */}
          </div>
        </div>
        {showSubscriptionDropdown && (
          <div className="transition-all ease-in-out duration-300 h-fit max-h-[100px] border-t border-t-gray-200">
            {subscriptions.map((item) => (
              <div className="flex items-center px-14px py-10px">
                <img
                  src="/checkmark.svg"
                  alt="checkmark icon"
                  className={
                    activeSubscription === item ? "opacity-100" : "opacity-0"
                  }
                />
                <button
                  onClick={() => {
                    setActiveSubscription(item);
                    setSubscriptionDropdownState(false);
                  }}
                  className="text-14 text-gray-500 py-2px px-8px border-r border-gray-200"
                >
                  {item}
                </button>
                <p className="text-12 text-gray-500 pl-10px max-w-[200px] whitespace-nowrap overflow-ellipsis">
                  https://convoy.events/htisspsos1
                </p>
                <img
                  src="/arrow-right.svg"
                  alt="arrow-right icon"
                  className="mx-10px"
                />
                <p className="text-12 text-gray-500 max-w-[200px] whitespace-nowrap overflow-ellipsis">
                  https://convoy.events/htisspsos1
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {!showEvents && (
        <div className="rounded-12px bg-white-100 h-340px shadow-sm flex flex-col items-center justify-center mt-24px">
          <img
            src="/empty-state.svg"
            alt="empty state icon"
            className="mb-48px"
          />

          <p className="text-center text-14 text-gray-600 font-medium">
            Waiting for your first event...
          </p>
        </div>
      )}

      {showEvents && (
        <div className="flex mb-200px  border-t border-gray-200 mt-40px">
          <div className="min-w-[605px] w-full h-full overflow-hidden border-r border-gray-200">
            <table className="w-full border-b border-gray-200">
              <tbody>
                <tr className="border-b border-gray-200 py-10px">
                  <td className="text-12 text-gray-400 py-10px">
                    17 Jan, 2022
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium w-fit rounded-24px bg-success-50 text-success-500 my-10px">
                      Success
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium max-w-[160px] whitespace-nowrap overflow-ellipsis rounded-24px bg-gray-100 text-gray-400">
                      dfi30-9hfk89-ds0...
                      <button className="border-none bg-transparent">
                        <img
                          src="/copy.svg"
                          alt="copy icon"
                          className="ml-4px"
                        />
                      </button>
                    </div>
                  </td>
                  <td className="text-12 text-gray-500">10:45:11Am</td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img
                        src="/arrow-up-right.svg"
                        alt="arrow right up icon"
                      />
                    </button>
                  </td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img src="/refresh.svg" alt="refresh icon" />
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium w-fit rounded-24px bg-success-50 text-success-500 my-10px">
                      Success
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium max-w-[160px] whitespace-nowrap overflow-ellipsis rounded-24px bg-gray-100 text-gray-400">
                      dfi30-9hfk89-ds0...
                      <button className="border-none bg-transparent">
                        <img
                          src="/copy.svg"
                          alt="copy icon"
                          className="ml-4px"
                        />
                      </button>
                    </div>
                  </td>
                  <td className="text-12 text-gray-500">10:45:11Am</td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img
                        src="/arrow-up-right.svg"
                        alt="arrow right up icon"
                      />
                    </button>
                  </td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img src="/refresh.svg" alt="refresh icon" />
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium w-fit rounded-24px bg-success-50 text-success-500 my-10px">
                      Success
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium max-w-[160px] whitespace-nowrap overflow-ellipsis rounded-24px bg-gray-100 text-gray-400">
                      dfi30-9hfk89-ds0...
                      <button className="border-none bg-transparent">
                        <img
                          src="/copy.svg"
                          alt="copy icon"
                          className="ml-4px"
                        />
                      </button>
                    </div>
                  </td>
                  <td className="text-12 text-gray-500">10:45:11Am</td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img
                        src="/arrow-up-right.svg"
                        alt="arrow right up icon"
                      />
                    </button>
                  </td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img src="/refresh.svg" alt="refresh icon" />
                    </button>
                  </td>
                </tr>

                <tr className="border-b border-t border-gray-200 py-10px">
                  <td className="text-12 text-gray-400 py-10px">
                    17 Jan, 2022
                  </td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium w-fit rounded-24px bg-success-50 text-success-500 my-10px">
                      Success
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium max-w-[160px] whitespace-nowrap overflow-ellipsis rounded-24px bg-gray-100 text-gray-400">
                      dfi30-9hfk89-ds0...
                      <button className="border-none bg-transparent">
                        <img
                          src="/copy.svg"
                          alt="copy icon"
                          className="ml-4px"
                        />
                      </button>
                    </div>
                  </td>
                  <td className="text-12 text-gray-500">10:45:11Am</td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img
                        src="/arrow-up-right.svg"
                        alt="arrow right up icon"
                      />
                    </button>
                  </td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img src="/refresh.svg" alt="refresh icon" />
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium w-fit rounded-24px bg-success-50 text-success-500 my-10px">
                      Success
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium max-w-[160px] whitespace-nowrap overflow-ellipsis rounded-24px bg-gray-100 text-gray-400">
                      dfi30-9hfk89-ds0...
                      <button className="border-none bg-transparent">
                        <img
                          src="/copy.svg"
                          alt="copy icon"
                          className="ml-4px"
                        />
                      </button>
                    </div>
                  </td>
                  <td className="text-12 text-gray-500">10:45:11Am</td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img
                        src="/arrow-up-right.svg"
                        alt="arrow right up icon"
                      />
                    </button>
                  </td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img src="/refresh.svg" alt="refresh icon" />
                    </button>
                  </td>
                </tr>

                <tr>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium w-fit rounded-24px bg-success-50 text-success-500 my-10px">
                      Success
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-center px-12px py-2px text-12 font-medium max-w-[160px] whitespace-nowrap overflow-ellipsis rounded-24px bg-gray-100 text-gray-400">
                      dfi30-9hfk89-ds0...
                      <button className="border-none bg-transparent">
                        <img
                          src="/copy.svg"
                          alt="copy icon"
                          className="ml-4px"
                        />
                      </button>
                    </div>
                  </td>
                  <td className="text-12 text-gray-500">10:45:11Am</td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img
                        src="/arrow-up-right.svg"
                        alt="arrow right up icon"
                      />
                    </button>
                  </td>
                  <td>
                    <button className="border-none bg-transparent">
                      <img src="/refresh.svg" alt="refresh icon" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-16px">
              <div class="flex items-center">
                <button className="flex items-center px-16px py-8px rounded-8px border border-primary-400 text-primary-400 text-12">
                  <img
                    src="/angle-left.svg"
                    alt="angle right icon"
                    className="mr-6px"
                  />
                  Previous
                </button>
                <button className="ml-24px flex items-center px-16px py-8px rounded-8px border border-primary-400 text-primary-400 text-12">
                  Next
                  <img
                    src="/angle-right.svg"
                    alt="angle left icon"
                    className="ml-6px"
                  />
                </button>
              </div>

              <p className="font-medium text-14 text-gray-500 pr-10px">
                1-50 of 234
              </p>
            </div>
          </div>
          <div className="max-w-[450px] w-full">
            <div className="flex items-center justify-between border-b border-gray-200">
              <ul className="flex flex-row m-auto w-full">
                {tabs.map((tab) => (
                  <li
                    key={tab}
                    className="mr-24px !list-none first-of-type:ml-24px last-of-type:mr-0"
                  >
                    <button
                      className={
                        activeTab === tab
                          ? "pb-12px pt-8px flex items-center active"
                          : "pb-12px pt-8px flex items-center"
                      }
                      onClick={() => setActiveTab(tab)}
                    >
                      <span className="text-12 text-left capitalize text-gray-500 tracking-[0.02em]">
                        {tab}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              <button className="flex items-center rounded-4px pl-10px pr-16px py-2px bg-primary-50 text-12 text-primary-400">
                <img
                  src="/refresh-primary.svg"
                  alt="refresh icon"
                  className="mr-4px"
                />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
