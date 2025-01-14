import {
  Dimensions,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  useGetInfoByIdQuery,
  useGetProfileQuery,
  useUpdateProfileMutation,
} from "@/src/features/user/user.service";
import { Stack, useRouter } from "expo-router";
import Header from "@/src/components/navigation/Header";
import HeaderButton from "@/src/components/navigation/HeaderButton";
import { BackgroundColor, BrandColor, TextColor } from "@/src/constants/Colors";
import { AntDesign, Fontisto } from "@expo/vector-icons";
import { useLocale } from "@/src/hooks/useLocale";
import BottomContainer from "@/src/components/BottomContainer";
import Button from "@/src/components/buttons/Button";
import Input from "@/src/components/Input";
import { UserProfile } from "@/src/types/enum";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/src/hooks/hooks";
import { Dropdown } from "react-native-element-dropdown";
import { ThemedText } from "@/src/components/ThemedText";
import { TextType } from "@/src/types/text";
import { TextInput } from "react-native-gesture-handler";
import { Pressable } from "react-native";
import { ChevronDown } from "react-native-feather";
import { TouchableOpacity } from "react-native";
import RNDateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { compareAsc, format } from "date-fns";
import Toast from "react-native-toast-message";
import Loading from "@/src/components/Loading";
import * as ImagePicker from "expo-image-picker";
const CLOUDINARY_UPLOAD_PRESET = "dy9yts4fa";
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dy9yts4fa/image/upload";
const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

type AndroidMode = "date" | "time";

type ProfileForm = Partial<UserProfile>;

const initialProfile: ProfileForm = {
  name: "",
  email: "",
  avatar_url: "",
  dob: "",
  gender: "male",
};

const Page = () => {
  const router = useRouter();
  const { t } = useLocale();
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    avatar_url: "",
    dob: "",
    gender: "male",
  });
  const [isFocusGender, setIsFocusGender] = useState(false);
  const [mode, setMode] = useState<AndroidMode>("date");
  const [show, setShow] = useState(false);

  const genders = [
    { label: t("settings.male"), value: "male" },
    { label: t("settings.female"), value: "female" },
    { label: t("settings.other"), value: "other" },
  ];
  const userId = useAppSelector((state) => state.auth.user._id);
  console.log(userId);
  const getProfile = useGetInfoByIdQuery(userId);
  const [updateProfile, updateProfileResult] = useUpdateProfileMutation();

  useEffect(() => {
    if (getProfile.data) {
      const user = getProfile.data;
      setProfile((prev) => ({
        ...prev,
        name: user.name ?? prev.name,
        email: user.email,
        avatar_url: user.avatar_url,
        dob: user.dob,
      }));
    }
  }, [getProfile]);

  // useEffect(() => {
  //   if(updateProfileResult.isSuccess) {
  //     Toast.show({
  //       type: 'success',
  //       text1: 'Success',
  //     })
  //   }

  // }, [updateProfileResult])

  const onChange = (event: DateTimePickerEvent, date?: Date) => {
    const currentDate = date;
    if (currentDate && compareAsc(date, new Date()) !== -1) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: t("settings.invaliddob"),
      });
      return;
    }
    setShow(false);
    setProfile((prev) => ({ ...prev, dob: currentDate!.toString() }));
  };

  const showMode = (currentMode: AndroidMode) => {
    setShow(true);
    setMode(currentMode);
  };
  const showDatepicker = () => {
    showMode("date");
  };

  const handlePickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Toast.show({
          type: "error",
          text1: "Permission Denied",
          text2: "You need to allow access to your photo library.",
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const localUri = result.assets[0].uri;

        const formData = new FormData();
        formData.append("file", {
          uri: localUri,
          name: "profile.jpg",
          type: "image/jpeg",
        });
        formData.append("upload_preset", "my_preset");
        const response = await fetch(CLOUDINARY_URL, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log("Cloudinary Response:", data);

        if (data.secure_url) {
          setProfile((prev) => ({
            ...prev,
            avatar_url: data.secure_url,
          }));
          formData.append("name", profile.name!);
          formData.append("dob", profile.dob!);
          formData.append("gender", profile.gender!);
          formData.append("avatar_url", data.secure_url!);
          await updateProfile(formData).unwrap();
          Toast.show({
            type: "success",
            text1: "Profile Updated",
            text2: "Your avatar has been updated successfully.",
          });
        }
      }
    } catch (error) {
      console.log("Error uploading image:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to upload image. Please try again.",
      });
    }
  };
  const handleUpdateProfile = async () => {
    try {
      const formData = new FormData();
      formData.append("name", profile.name!);
      formData.append("dob", profile.dob!);
      formData.append("gender", profile.gender!);
      formData.append("avatar_url", profile.avatar_url!);
      await updateProfile(formData).unwrap();
    } catch (error) {
      console.log("🚀 ~ handleUpdateProfile ~ error:", error);
    }
  };
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: t("settings.editaccount"),
          header: (props) => (
            <Header
              {...props}
              headerLeft={() => (
                <HeaderButton
                  onPress={() => router.back()}
                  type="btn"
                  button={() => (
                    <AntDesign
                      name="arrowleft"
                      size={24}
                      color={TextColor.Primary}
                    />
                  )}
                />
              )}
            />
          ),
        }}
      />
      <Loading isLoading={getProfile.isFetching} text="Loading..." />
      <TouchableOpacity onPress={handlePickImage}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.defaultAvatar}>
            <AntDesign name="user" size={48} color={TextColor.Placeholder} />
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.form}>
        <Input
          label={t("settings.name")}
          value={profile.name}
          placeholder={t("settings.name")}
          onChangeText={(value) =>
            setProfile((prev) => ({ ...prev, name: value }))
          }
        />

        <View>
          <ThemedText
            type={TextType.FootnoteSemibold}
            color={TextColor.Primary}
            style={styles.label}
          >
            {t("settings.gender")}
          </ThemedText>
          <Dropdown
            style={[
              styles.dropdown,
              isFocusGender && {
                borderColor: BrandColor.Blue[600],
                backgroundColor: BackgroundColor.LightTheme.Tertiary,
              },
            ]}
            selectedTextStyle={styles.selectedTextStyle}
            data={genders}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={t("settings.selectgender")}
            renderRightIcon={() => (
              <AntDesign
                name="down"
                size={12}
                color={BrandColor.PrimaryColor[400]}
                style={styles.icon}
              />
            )}
            itemTextStyle={{ fontSize: 14 }}
            value={profile.gender}
            onFocus={() => setIsFocusGender(true)}
            onBlur={() => setIsFocusGender(false)}
            onChange={(item) => {
              setProfile((prev) => ({
                ...prev,
                gender:
                  item.value === "male"
                    ? "male"
                    : item.value === "female"
                    ? "female"
                    : "other",
              }));
              setIsFocusGender(false);
            }}
          />
        </View>
        <SafeAreaView>
          <View style={{ position: "absolute", left: 0, top: 0 }}>
            <ThemedText
              type={TextType.FootnoteSemibold}
              color={TextColor.Primary}
              style={styles.label}
            >
              {t("settings.dob")}
            </ThemedText>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={showDatepicker}
              style={[styles.button, { width: "100%" }]}
            >
              <View style={{ flex: 3 }}>
                <Text>
                  {profile.dob
                    ? format(new Date(profile.dob), "PPP")
                    : "DD/MM/YYYY"}
                </Text>
              </View>
              <ChevronDown
                width={24}
                height={24}
                color={TextColor.Placeholder}
              />
            </Pressable>
          </View>
          <View style={styles.datePicker}>
            {show && (
              <RNDateTimePicker
                testID="dateTimePicker"
                value={
                  profile.dob ? new Date(profile.dob) : new Date(2000, 0, 1)
                }
                mode={mode}
                display="spinner"
                is24Hour={true}
                onChange={onChange}
              />
            )}
          </View>
        </SafeAreaView>

        <Input
          label={t("settings.email")}
          value={profile.email}
          editable={false}
        />
      </View>

      <BottomContainer>
        <Button
          type="primary"
          text={t("actions.save")}
          size="large"
          state="normal"
          onPress={handleUpdateProfile}
          isLoading={updateProfileResult.isLoading}
        />
      </BottomContainer>
    </View>
  );
};
export default Page;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: BackgroundColor.LightTheme.Primary,
  },
  form: {
    gap: 40,
    marginTop: 36,
  },
  dropdown: {
    height: 54,
    borderColor: BrandColor.Gray[300],
    borderWidth: 0.5,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  selectedTextStyle: {
    fontSize: 14,
    color: TextColor.Primary,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: "absolute",
    top: -20,
    left: 0,
  },
  datePicker: {
    maxHeight: screenHeight * 0.15,
  },
  button: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    width: screenWidth - 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BrandColor.Gray[300],
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginVertical: 20,
  },
  defaultAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BrandColor.Gray[200],
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginVertical: 20,
  },
});
