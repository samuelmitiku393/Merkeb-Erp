import React from "react";
import {
    Box,
    Typography,
    Paper,
    Avatar,
    Button,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon
} from "@mui/material";
import {
    Person as PersonIcon,
    Settings as SettingsIcon,
    Notifications as NotificationsIcon,
    Help as HelpIcon,
    Logout as LogoutIcon
} from "@mui/icons-material";

const Profile = () => {
    return (
        <Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Profile
            </Typography>

            <Paper sx={{ p: 3, mt: 2 }}>
                <Box display="flex" alignItems="center" mb={3}>
                    <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                        A
                    </Avatar>
                    <Box>
                        <Typography variant="h6">Admin User</Typography>
                        <Typography variant="body2" color="text.secondary">
                            admin@example.com
                        </Typography>
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <List>
                    <ListItem button>
                        <ListItemIcon>
                            <PersonIcon />
                        </ListItemIcon>
                        <ListItemText primary="Account Settings" />
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <NotificationsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Notifications" />
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <SettingsIcon />
                        </ListItemIcon>
                        <ListItemText primary="Preferences" />
                    </ListItem>
                    <ListItem button>
                        <ListItemIcon>
                            <HelpIcon />
                        </ListItemIcon>
                        <ListItemText primary="Help & Support" />
                    </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    fullWidth
                >
                    Logout
                </Button>
            </Paper>
        </Box>
    );
};

export default Profile;