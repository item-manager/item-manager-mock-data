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

const { users, auth, locations, labels, items, instance } = api;

let locationNos: number[];
let labelNos: number[];

const password = "string";

function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined;
}

const createRandomUser = async (): Promise<string> => {
  const uuid = faker.datatype.uuid();
  const id = `tester_${uuid}`;
  try {
    await users.createUser({
      id,
      username: `${id}_nickname`,
      password,
    });
    console.log("created user", id);
    return id;
  } catch (e) {
    if (e instanceof AxiosError) {
      console.log(
        "createRandomUser",
        e.code,
        e.response?.data?.message,
        e.config?.data
      );
    }
    throw e;
  }
};

const login = async (userId: string) => {
  console.log("login start", userId);

  const response = await auth.login({ id: userId, password });
  console.log("logged in", userId);
  cookieString = response.headers["set-cookie"];
};

const createRandomRoom = async (): Promise<number[]> => {
  const roomName = faker.address.country();

  try {
    // 방 생성
    const {
      data: { data },
    } = await locations.createRoom({
      name: roomName,
    });

    const roomNo = data?.roomNo!;
    console.log("created room", roomNo);

    const placesLength = faker.datatype.number({ min: 0, max: 15 });
    const placeNos = (
      await Promise.all(
        Array.from({ length: placesLength }).map(() =>
          createRandomPlace(roomNo)
        )
      )
    ).filter(notEmpty);

    return [...placeNos];
  } catch (e) {
    if (e instanceof AxiosError) {
      console.error(
        "createRandomRoom",
        e.code,
        e.response?.data?.message,
        e.config?.data
      );
    }
    return [];
  }
};

const createRandomPlace = async (
  roomNo: number
): Promise<number | undefined> => {
  const placeName = faker.address.cityName();

  try {
    // 방 안의 위치 생성
    const {
      data: { data },
    } = await locations.createPlace({
      roomNo,
      name: placeName,
    });

    const placeNo = data?.placeNo!;
    console.log("created place", placeNo);

    return placeNo;
  } catch (e) {
    if (e instanceof AxiosError) {
      console.error(
        "createRandomPlace",
        e.code,
        e.response?.data?.message,
        e.config?.data
      );
    }
  }
};

const createRandomLabel = async (): Promise<number | undefined> => {
  const labelName = faker.music.genre();

  try {
    // 방 안의 위치 생성
    const {
      data: { data },
    } = await labels.createLabel({
      name: labelName,
    });

    const labelNo = data?.labelNo!;
    console.log("created label", labelNo);

    return labelNo;
  } catch (e) {
    if (e instanceof AxiosError) {
      console.error(
        "createRandomLabel",
        e.code,
        e.response?.data?.message,
        e.config?.data
      );
    }
  }
};

const createRandomItem = async (): Promise<number | undefined> => {
  const itemName = faker.commerce.productName();
  const locationNo = faker.helpers.arrayElement(locationNos);
  const type = faker.helpers.arrayElement(["CONSUMABLE", "EQUIPMENT"] as const);
  const labels = faker.helpers.arrayElement([
    [],
    faker.helpers.arrayElements(labelNos),
  ]);
  const locationMemo = faker.helpers.arrayElement([
    undefined,
    faker.lorem.sentence(),
  ]);

  const priority =
    faker.helpers.maybe(() => faker.helpers.arrayElement([1, 2, 3, 4, 5]), {
      probability: 0.1,
    }) || 0;

  let photoName: string | undefined = undefined;
  // 이미지 생성
  if (
    true
    // faker.helpers.maybe(() => true, { probability: 0.9 })
  ) {
    let loop = true;
    while (loop) {
      try {
        const catUrl = faker.image.cats();
        const response = await axios.get(catUrl, {
          responseType: "arraybuffer",
        });
        // ArrayBuffer를 Blob 객체로 변환
        const blob = new Blob([response.data], {
          type: response.headers["content-type"],
        });

        const form = new FormData();
        form.append("file", blob);

        const {
          data: {
            data: { filename },
          },
        } = await instance.post("/images", form);

        photoName = filename;
        console.log("이미지 생성됨", photoName);

        loop = false;
      } catch {
        console.error("재시도중..", itemName);
        await new Promise((res) => setTimeout(res, 10000));
      }
    }
  }

  try {
    // 물품 생성
    const {
      data: { data },
    } = await items.createItem({
      name: itemName,
      locationNo,
      type,
      labels,
      locationMemo,
      photoName,
      priority,
    });

    const itemNo = data?.itemNo!;
    console.log("created item", itemNo);

    // 물품 구매
    const randomPurchaseItemLength = faker.datatype.number({ min: 0, max: 15 });
    let quantity = (
      await Promise.all(
        Array.from({ length: randomPurchaseItemLength }).map(() =>
          randomPurchaseItem(itemNo)
        )
      )
    )
      .filter(notEmpty)
      .reduce((acc, cur) => acc + cur, 0);

    // 물품 사용
    const randomConsumeItemLength = faker.datatype.number({ min: 0, max: 3 });
    for (let i = 0; i < randomConsumeItemLength; i++) {
      const rest = await randomConsumeItem(itemNo, quantity);

      if (rest !== undefined) {
        quantity = rest;
      }

      if (rest === 0) break;
    }

    return itemNo;
  } catch (e) {
    if (e instanceof AxiosError) {
      console.error(
        "createRandomItem",
        e.code,
        e.response?.data?.message,
        e.config?.data
      );
    }
  }
};

const randomPurchaseItem = async (
  itemNo: number
): Promise<number | undefined> => {
  const unitPrice = parseInt(faker.commerce.price());
  const count = faker.datatype.number({ min: 1, max: 10 });
  const date = faker.date.past().toISOString();
  const mall = faker.company.name();

  try {
    // 방 안의 위치 생성
    const {
      data: { data },
    } = await items.purchaseItem(itemNo, {
      count,
      date,
      mall,
      unitPrice,
    });

    const quantity = data?.quantity!;
    console.log("purchased item", quantity);

    return quantity;
  } catch (e) {
    if (e instanceof AxiosError) {
      console.error(
        "randomPurchaseItem",
        e.code,
        e.response?.data?.message,
        e.config?.data
      );
    }
  }
};

const randomConsumeItem = async (
  itemNo: number,
  quantity: number
): Promise<number | undefined> => {
  const date = faker.date.recent().toISOString();
  const count = faker.datatype.number({ min: 1, max: quantity });

  try {
    // 방 안의 위치 생성
    const {
      data: { data },
    } = await items.consumeItem(itemNo, {
      count,
      date,
    });

    const rest = data?.quantity!;
    console.log("consumed item", rest);

    return rest;
  } catch (e) {
    if (e instanceof AxiosError) {
      console.error(
        "randomConsumeItem",
        e.code,
        e.response?.data?.message,
        e.config?.data
      );
    }
  }
};

(async () => {
  // 로그인
  // await login('tester');

  // const userIds = await Promise.all(
  //   Array.from({ length: 1 }).map(() => createRandomUser())
  // );

  const userIds = ["string"];

  for (const userId of userIds) {
    console.group(userId);

    // 로그인
    await login(userId);

    // Location 생성
    const locationsLength = faker.datatype.number({ min: 0, max: 15 });
    locationNos = (
      await Promise.all(
        Array.from({ length: locationsLength }).map(() => createRandomRoom())
      )
    ).flat();

    // 라벨 생성
    const labelsLength = faker.datatype.number({ min: 0, max: 15 });
    labelNos = (
      await Promise.all(
        Array.from({ length: labelsLength }).map(() => createRandomLabel())
      )
    )
      .filter(notEmpty)
      .flat();

    // 물품 생성 / 구매 / 사용
    const itemsLength = 100;
    await Promise.all(
      Array.from({ length: itemsLength }).map(() => createRandomItem())
    );

    console.groupEnd();
  }
})();
