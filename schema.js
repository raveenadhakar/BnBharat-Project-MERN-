const Joi =  require("joi"); 

module.exports.listingSchema = Joi.object({
    listing : Joi.object({
        title : Joi.string().required().min(3).max(50),
        description : Joi.string().required(),
        propertyType : Joi.string().required(),
        location : Joi.string().required(),
        country : Joi.string().required(),
        price : Joi.number().required().min(0),
        discount : Joi.number().required().min(0),
        bathrooms : Joi.number().required().min(1),
        beds : Joi.number().required().min(1),
        guests : Joi.number().required().min(1),
        bedrooms : Joi.number().required().min(1),
        rules: Joi.array().items(Joi.string()).required(),
        amenities: Joi.array().items(Joi.string()).required(),
        images: Joi.array().items(Joi.string().allow("", null)).max(5)
    }).required(),
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating : Joi.number().required().min(1).max(5),
        comment : Joi.string().required(),
    }).required(),
})