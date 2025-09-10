import { memo, useCallback } from "react";
import useLayoutStore from "./store/use-layout-store";
import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { MenuItem } from "./menu-item/menu-item";
import { useIsLargeScreen } from "@/hooks/use-media-query";
import { useSession, signOut } from "next-auth/react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Define menu items configuration for better maintainability
const MENU_ITEMS = [
	{
		id: "uploads",
		icon: Icons.upload,
		label: "Uploads",
		ariaLabel: "Add and manage uploads",
	},
	{
		id: "texts",
		icon: Icons.type,
		label: "Texts",
		ariaLabel: "Add and edit text elements",
	},
	{
		id: "videos",
		icon: Icons.video,
		label: "Videos",
		ariaLabel: "Add and manage video content",
	},
	{
		id: "images",
		icon: Icons.image,
		label: "Images",
		ariaLabel: "Add and manage images",
	},
	{
		id: "audios",
		icon: Icons.audio,
		label: "Audio",
		ariaLabel: "Add and manage audio content",
	},
	{
		id: "variations",
		icon: Icons.smart,
		label: "Variations",
		ariaLabel: "Quick access to text variations",
	},
	{
		id: "progress-bar-settings",
		icon: Icons.settings,
		label: "Progress Bar",
		ariaLabel: "Customize progress bar settings",
	},
] as const;

// Memoized menu button component for better performance
const MenuButton = memo<{
	item: (typeof MENU_ITEMS)[number];
	isActive: boolean;
	onClick: (menuItem: string) => void;
}>(({ item, isActive, onClick }) => {
	const handleClick = useCallback(() => {
		onClick(item.id);
	}, [item.id, onClick]);

	const IconComponent = item.icon;

	return (
		<Button
			onClick={handleClick}
			className={cn(
				"transition-colors duration-200 hover:bg-secondary/80",
				isActive
					? "bg-secondary text-secondary-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
			variant="ghost"
			size="icon"
			aria-label={item.ariaLabel}
			aria-pressed={isActive}
		>
			{IconComponent ? <IconComponent width={16} height={16} /> : null}
		</Button>
	);
});

MenuButton.displayName = "MenuButton";

// User profile component for the sidebar
const UserProfile = memo(() => {
	const { data: session } = useSession();

	if (!session?.user) {
		return null;
	}

	const handleSignOut = async () => {
		await signOut({ callbackUrl: "/login" });
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<div className="mt-auto border-t border-border/80 pt-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="w-10 h-10 rounded-full mx-auto"
						aria-label="User menu"
					>
						<Avatar className="w-8 h-8">
							<AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
							<AvatarFallback className="text-xs">
								{session.user.name ? getInitials(session.user.name) : "U"}
							</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">
								{session.user.name}
							</p>
							<p className="text-xs leading-none text-muted-foreground">
								{session.user.email}
							</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleSignOut}>
						Sign out
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
});

UserProfile.displayName = "UserProfile";

// Main MenuList component
function MenuList() {
	const {
		setActiveMenuItem,
		setShowMenuItem,
		activeMenuItem,
		showMenuItem,
		drawerOpen,
		setDrawerOpen,
	} = useLayoutStore();

	const isLargeScreen = useIsLargeScreen();

	const handleMenuItemClick = useCallback(
		(menuItem: string) => {
			setActiveMenuItem(menuItem as any);
			// Use drawer on mobile, sidebar on desktop
			if (!isLargeScreen) {
				setDrawerOpen(true);
			} else {
				setShowMenuItem(true);
			}
		},
		[isLargeScreen, setActiveMenuItem, setDrawerOpen, setShowMenuItem],
	);

	const handleDrawerOpenChange = useCallback(
		(open: boolean) => {
			setDrawerOpen(open);
		},
		[setDrawerOpen],
	);

	return (
		<>
			<nav
				className="flex w-14 flex-col items-center gap-1 border-r border-border/80 py-2"
				role="toolbar"
				aria-label="Editor tools"
			>
				{MENU_ITEMS.map((item) => {
					const isActive =
						(drawerOpen && activeMenuItem === item.id) ||
						(showMenuItem && activeMenuItem === item.id);

					return (
						<MenuButton
							key={item.id}
							item={item}
							isActive={isActive}
							onClick={handleMenuItemClick}
						/>
					);
				})}
				<UserProfile />
			</nav>

			{/* Drawer only on mobile/tablet - conditionally mounted */}
			{!isLargeScreen && (
				<Drawer open={drawerOpen} onOpenChange={handleDrawerOpenChange}>
					<DrawerContent className="max-h-[80vh]">
						<DrawerHeader>
							<DrawerTitle className="capitalize">{activeMenuItem}</DrawerTitle>
						</DrawerHeader>
						<div className="flex-1 overflow-auto">
							<MenuItem />
						</div>
					</DrawerContent>
				</Drawer>
			)}
		</>
	);
}

export default memo(MenuList);
