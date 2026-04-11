import TermsAndConditions from "@/components/code/CommunityTermsAndCondition";
import Header from "@/components/code/Header";
import { Button } from "@/components/ui/button";
import { useGetAllCommunitiesQuery } from "@/state/api/communityApi";
import { useAppDispatch, useAppSelector, type RootState } from "@/state/redux";
import { Compass, Loader2, ServerCrash } from "lucide-react";
import React, { useState } from "react";
import { CommunityCard } from "./CommunityCard";
import SearchBar from "@/components/code/Searchbar";
import { setCommunityMetadata } from "@/state/slice/communitySlice";

const AllCommunities = () => {
  const dispatch = useAppDispatch();
  const [termsOpen, setTermsOpen] = React.useState(false);
  const [page, setPage] = useState(1);
  const searchQuery = useAppSelector(
    (state: RootState) => state.global.searchQuery,
  );
  const { communityMetadata } = useAppSelector(
    (state: RootState) => state.community,
  );

  const {
    data: allCommunities,
    isLoading,
    isError,
    isFetching,
  } = useGetAllCommunitiesQuery({
    page,
    page_size: 10,
    query: searchQuery,
    order_by: "",
  });

  React.useEffect(() => {
    const accepted = sessionStorage.getItem("termsAccepted");
    if (!accepted) setTermsOpen(true);
  }, []);

  React.useEffect(() => {
    dispatch(setCommunityMetadata(allCommunities?.MetaData ?? null));
  }, [allCommunities, dispatch]);

  const handleAccepted = () => {
    sessionStorage.setItem("termsAccepted", "true");
    setTermsOpen(false);
  };
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <TermsAndConditions open={termsOpen} onAccepted={handleAccepted} />

      <Header
        title="All Communities"
        subTitle="Discover and join communities"
      />

      <main className="px-6 py-4 overflow-y-auto flex-1">
        <SearchBar />

        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading communities...
              </p>
            </div>
          )}
          {/* Error state */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ServerCrash className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Failed to load communities. Try again later.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            (!allCommunities || allCommunities.Communities.length === 0) && (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="h-16 w-16 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Compass className="h-8 w-8 text-orange-400" />
                </div>
                <p className="text-base font-semibold text-gray-700">
                  No communities found
                </p>
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try a different search.`
                    : "No communities yet. Be the first to create one!"}
                </p>
              </div>
            )}
          {!isLoading &&
            !isError &&
            allCommunities &&
            allCommunities.Communities.length > 0 && (
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity duration-200 ${
                  isFetching ? "opacity-50 pointer-events-none" : "opacity-100"
                }`}
              >
                {allCommunities.Communities.map((community) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            )}
          {!isLoading && !isError && communityMetadata && (
            <div className="flex items-center justify-between mt-6 pb-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Previous"
                )}
              </Button>

              <span className="text-xs text-muted-foreground">
                Page {communityMetadata.current_page} of{" "}
                {communityMetadata.last_page}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={page === communityMetadata.last_page || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {isFetching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AllCommunities;
