
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box
} from "@mui/material";

import {
  AddShoppingCartOutlined
} from "@mui/icons-material";

export default function ProductCard({ product, onAddToCart }) {
  const inStock = product.stock > 0;

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 3,
        transition: "transform 0.2s, box-shadow 0.2s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: 6
        }
      }}
    >
      <CardMedia
        component="img"
        image={product.image}
        alt={product.name}
        sx={{
          height: { xs: 180, sm: 200 },
          objectFit: "contain",
          bgcolor: "#f8fafc",
          p: 2
        }}
      />

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="caption"
          color="text.secondary"
        >
          {product.category}
        </Typography>

        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            mt: 0.5,
            fontSize: { xs: "1rem", md: "1.1rem" }
          }}
        >
          {product.name}
        </Typography>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap"
          }}
        >
          <Typography
            variant="h6"
            color="primary.main"
            fontWeight={800}
          >
            {product.price.toLocaleString("fr-MA")} MAD
          </Typography>

          <Chip
            label={inStock ? (product.stock) + " available" : "Out of Stock"}
            color={inStock ? "success" : "error"}
            size="small"
            variant="outlined"
          />
        </Box>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          disabled={!inStock}
          startIcon={<AddShoppingCartOutlined />}
          onClick={() => onAddToCart(product)}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            py: 1.2
          }}
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  );
}
