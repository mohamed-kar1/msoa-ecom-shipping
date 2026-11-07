import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import { ArrowForwardRounded } from "@mui/icons-material";
import { orderService } from "../services/orderService";

import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Divider,
    Stack,
    Step,
    StepLabel,
    Stepper,
    Typography
} from "@mui/material";

import {
    LocalShippingOutlined,
    ContentCopyOutlined
} from "@mui/icons-material";

import { IconButton, Tooltip } from "@mui/material";
import { shippingService } from "../services/shippingService";

const steps = [
    "Preparing",
    "Shipped",
    "In Transit",
    "Delivered"
];

const statusIndex = {
    PREPARING: 0,
    SHIPPED: 1,
    IN_TRANSIT: 2,
    DELIVERED: 3
};

export default function ShipmentTracker({ orderId }) {
    const [shipment, setShipment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updating, setUpdating] = useState(false);

    const nextStatus = {
        PREPARING: "SHIPPED",
        SHIPPED: "IN_TRANSIT",
        IN_TRANSIT: "DELIVERED"
    };

    const advanceShipment = async () => {
        if (!shipment || updating) return;

        const next = nextStatus[shipment.status];
        if (!next) return;

        setUpdating(true);
        setError("");

        try {
            const updated = await shippingService.updateStatus(
                shipment.id,
                next
            );

            // Synchronize the business-level order status.
            if (next === "SHIPPED") {
                await orderService.updateStatus(orderId, "SHIPPED");
            }

            if (next === "DELIVERED") {
                await orderService.updateStatus(orderId, "DELIVERED");
            }

            setShipment(updated);
        } catch (err) {
            setError(err.message || "Unable to update shipment.");
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        let active = true;

        async function loadShipment() {
            try {
                const data = await shippingService.getShipmentByOrder(orderId);

                if (active) setShipment(data);
            } catch (err) {
                if (active) setError(err.message);
            } finally {
                if (active) setLoading(false);
            }
        }

        loadShipment();

        return () => {
            active = false;
        };
    }, [orderId]);

    if (loading) {
        return (
            <Box sx={{ py: 2, textAlign: "center" }}>
                <CircularProgress size={24} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!shipment) {
        return (
            <Alert severity="info">
                No shipment has been created for this order yet.
            </Alert>
        );
    }

    const cancelled = shipment.status === "CANCELLED";
    const currentStep = statusIndex[shipment.status] ?? 0;

    return (
        <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />

            <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
                sx={{ mb: 3 }}
            >
                <Stack direction="row" alignItems="center" spacing={1}>
                    <LocalShippingOutlined color="primary" />
                    <Typography fontWeight={700}>
                        Shipment Tracking
                    </Typography>
                </Stack>

                <Chip
                    size="small"
                    label={shipment.status.replaceAll("_", " ")}
                    color={cancelled ? "error" : "info"}
                    variant="outlined"
                />
            </Stack>

            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ mb: 3, minWidth: 0 }}
            >
                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    Tracking:
                </Typography>

                <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ overflowWrap: "anywhere" }}
                >
                    {shipment.trackingNumber}
                </Typography>

                <Tooltip title="Copy tracking number">
                    <IconButton
                        size="small"
                        aria-label="Copy tracking number"
                        onClick={() =>
                            navigator.clipboard.writeText(shipment.trackingNumber)
                        }
                    >
                        <ContentCopyOutlined fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {cancelled ? (
                <Alert severity="warning">
                    This shipment has been cancelled.
                </Alert>
            ) : (
                <Stepper
                    activeStep={currentStep}
                    orientation="vertical"
                    sx={{
                        "& .MuiStepLabel-label": {
                            fontSize: { xs: "0.875rem", sm: "1rem" }
                        }
                    }}
                >
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            )}

            {nextStatus[shipment.status] && (
                <Button
                    variant="outlined"
                    size="small"
                    disabled={updating}
                    endIcon={<ArrowForwardRounded />}
                    onClick={advanceShipment}
                    sx={{
                    mt: 2,
                    textTransform: "none",
                    width: { xs: "100%", sm: "auto" }
                    }}
                >
                    {updating
                    ? "Updating..."
                    : `Simulate: ${nextStatus[shipment.status].replaceAll("_", " ")}`}
                </Button>
            )}

            {shipment.address && (
                <Box sx={{ mt: 3 }}>
                    <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        gutterBottom
                    >
                        Delivery Address
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        {shipment.address.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        {shipment.address.address}, {shipment.address.city}
                    </Typography>
                </Box>
            )}
        </Box>
    );
}
