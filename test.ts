import { faker } from "@faker-js/faker";
import axios, { AxiosError } from "axios";
import { Api } from "./__generated__/Api";

const api = new Api({ withCredentials: true });

let cookieString: any;

api.instance.interceptors.request.use((config) => {
  if (cookieString) {
    config.headers.Cookie = cookieString;
  }

  return config;
});

console.log("start");

const { users, auth } = api;

const password = "string";

const login = async (userId: string) => {
  console.log("login start", userId);

  const response = await auth.login({ id: userId, password });
  console.log("logged in", userId);
  cookieString = response.headers["set-cookie"];
};

(async () => {
  const userIds = ["string"];

  for (const userId of userIds) {
    console.group(userId);

    // 로그인
    await login(userId);

    const catUrl = faker.image.cats();
    const response = await axios.get(catUrl, { responseType: "arraybuffer" });
    // ArrayBuffer를 Blob 객체로 변환
    const blob = new Blob([response.data], {
      type: response.headers["content-type"],
    });

    const form = new FormData();
    form.append("file", blob);

    const {
      data: { data },
    } = await axios.post("http://ycrpark.iptime.org:8080/images", form, {
      headers: {
        Cookie: "JSESSIONID=C239B46EE45B696A7333AA46F64DAD79",
      },
    });

    console.log(data);

    // fetch("http://ycrpark.iptime.org:8080/images", {
    //   headers: {
    //     accept: "*/*",
    //     "accept-language": "en-US,en;q=0.9,ko;q=0.8",
    //     "content-type":
    //       "multipart/form-data; boundary=----WebKitFormBoundaryhm0CH6iV5EK3lkwg",
    //     cookie: "JSESSIONID=C239B46EE45B696A7333AA46F64DAD79",
    //     Referer: "http://ycrpark.iptime.org:8080/swagger-ui/index.html",
    //     "Referrer-Policy": "strict-origin-when-cross-origin",
    //   },
    //   body: '------WebKitFormBoundaryhm0CH6iV5EK3lkwg\r\nContent-Disposition: form-data; name="file"; filename="cb0193df-bf9c-4720-8a02-3825db305b2b.png"\r\nContent-Type: image/png\r\n\r\n\r\n------WebKitFormBoundaryhm0CH6iV5EK3lkwg--\r\n',
    //   method: "POST",
    // });

    console.groupEnd();
  }
})();
