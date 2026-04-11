import { useAppDispatch, useAppSelector } from "@/state/redux";
import { setActiveTab } from "@/state/slice/profileSlice";
import type { RootState } from "@/state/redux";

const ProfileTabs = () => {
  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(
    (state: RootState) => state.profile.activeTab,
  );

  const tabs = [
    { key: "posts", label: "Posts" },
    { key: "comments", label: "Comments" },
  ] as const;

  return (
    <div className="flex border-b">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => dispatch(setActiveTab(tab.key))}
          className={`px-4 py-2.5 text-sm font-medium transition-colors
                        ${
                          activeTab === tab.key
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ProfileTabs;
