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

const { auth, locations, labels, items } = api;

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

    // truncateLabels
    await (async function truncateLabels() {
      console.log("truncateLabels");

      const {
        data: { data },
      } = await labels.getLabels();

      await Promise.all(
        data!.map((value) => labels.deleteLabel(value.labelNo!))
      );
      console.groupEnd();
    })();

    // truncateItems
    await (async function truncateItems() {
      console.log("truncateItems");

      const {
        data: { data },
      } = await items.getItems();

      await Promise.all(data!.map((value) => items.deleteItem(value.itemNo!)));
      console.groupEnd();
    })();

    // truncateLocations
    await (async function truncateLocations() {
      console.log("truncateLocations");

      const {
        data: { data },
      } = await locations.allRooms();

      await Promise.all(
        data!.map(async (value) => {
          const roomNo = value.roomNo!;

          const {
            data: { data },
          } = await locations.getPlacesByRoomNo({ roomNo });

          await Promise.all(
            data!.map(async (value) => {
              await locations.deleteLocation(value.placeNo!);
            })
          );

          await locations.deleteLocation(roomNo);
        })
      );
      console.groupEnd();
    })();
  }
})();
