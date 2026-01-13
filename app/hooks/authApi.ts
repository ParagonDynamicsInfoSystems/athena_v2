import erpApi from "./erpApi";

export async function loginApi(username: string, password: string) {
  const response = await erpApi.post("/Athena/feeder/mobileApp/mobilelogin", {
    username,
    password,
  });
  return response.data;
}
