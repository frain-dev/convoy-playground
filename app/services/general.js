import { BehaviorSubject } from "rxjs";
import * as axios from "axios";

const _axios = axios.default;
const apiURL = process.env.API_URL;
const notification = new BehaviorSubject({
    message: "",
    style: "",
    show: false,
});

class GeneralService {
    notification = notification.asObservable();

    dismissNotification = () => {
        notification.next({ message: "", style: "", show: false });
    };

    showNotification = ({ message, style }) => {
        notification.next({ message, style, show: true });
        setTimeout(() => {
            this.dismissNotification();
        }, 5000);
    };

    request = ({ url, body, method }) => {
        const headers = {
            Authorization: '',
        };

        const http = _axios.create({
            baseURL: apiURL,
            headers,
        });

        http.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        return new Promise(async (resolve, reject) => {
            try {
                const { data } = await http({
                    url,
                    data: body,
                    method,
                });

                resolve(data);
            } catch (error) {
                if (_axios.isAxiosError(error)) {
                    return reject(error.response?.data?.message);
                } else {
                    return reject("An unexpected error occurred");
                }
            }
        });
    };
}

const General = new GeneralService();

export default General;
