"use strict";

const { default: createStrapi } = require("strapi");

const stripe = require("stripe")(
  "sk_test_51IVn5QGPu4P8AlUxD4UPA8SIiCPpP4x2fD1ho8gv7MlWGqOyOLCHaPAG7XIsRC3ugXoftchbx3196JzgNEPvFJm5004i3WBUwA"
);

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async create(ctx) {
    // recibimos los params que llegan desde el cliente
    const { token, products, idUser, addressShipping } = ctx.request.body;

    // calculamos el precio total de la factura
    let totalPayment = 0;
    products.forEach((product) => {
      totalPayment = totalPayment + product.price;
    });

    // realiza el pago generado por el usuario
    const charge = await stripe.charges.create({
      amount: totalPayment.toFixed(2) * 100,
      currency: "usd",
      source: token.id,
      description: `ID de usuario: ${idUser}`,
    });

    const createOrder = [];

    for await (const product of products) {
      const data = {
        game: product.id,
        users_permissions_user: idUser,
        totalPayment,
        idPayment: charge.id,
        addressShipping,
      };
      // validación de los datos a guardar en la BD
      const validData = await strapi.entityValidator.validateEntityCreation(
        strapi.models.order,
        data
      );

      const entry = await strapi.query("order").create(validData);
      createOrder.push(entry);
    }
    return createOrder;
  },
};
