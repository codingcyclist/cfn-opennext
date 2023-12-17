# Building a Serverless Image Carousel
## Prerequisites
- Familiarity with Node + React + Tailwind
- Basic Familiarity with AWS + Own AWS Account

## Core concepts
### Static Sites, SSR, and ISR
### Image optimization + re-sizing
Next.js comes with a built-int `loader` for image assets. The built-in `loader` loads images either from remote locations or from the server itself, optimizes image size and file formate dynamically, and store the images in the `<distDir>/cache/images` directory on the server. The optimized image file will be served for subsequent requests until the expiration is reached.

Next.js also has the option to provide custom `loader` functions. This is useful if you're using a CDN service such as [https://cloudinary.com/](https://cloudinary.com/) that already optimizes the images on your behalf and allows retrieval of those images at different sizes.

In our case, we're building a CDN ourselves, using:
- An s3 bucket to store both raw and optimized images
- A lambda function that automatically re-sizes when they get uploaded
- A CloudFront distribution to handle caching of images
- A lightweight server API to invalidate selected caches

#### What gets cached in CloudFront and when do we need to invalidate the cache
| path                    | content                                               | invalidation triggers | TTL                                           |   |
|-------------------------|-------------------------------------------------------|-----------------------|-----------------------------------------------|---|
| /_next/static/*         | static HMTL, CSS, and JavaScript                      | re-deployment         |                                               |   |
| /_next/image/*          | Cache for optimized images                            | re-deployment         | 1 Year (set via max-age attribute on s3 file) |   |
| /assets/static/{w}/*    | Optimized static images used on the website           | re-deployment         | 1 Year (set via max-age attribute on s3 file) |   |
| /assets/gallery/{w}/*   | Optimized pictures used in the image gallery          | deletion of photo     | 1 Year (set via max-age attribute on s3 file) |   |
| /assets/notifications/* | Landing zone for un-optimized static & gallery images | should not be cached  |                                               |   |
| /api/*                  | API requests                                          | should not be cached  |                                               |   |
| /*                      | Top-level requests to server function                 | should not be cached  |                                               |   |
#### Specify CloudFront cache behavior for images served from s3
We can simply 

### Serverless as a concept + architecture overview
### Cloudfront CDN + Hosting Websites on S3
### Infrastructure: CloudFormation

0. System Requirements
- Node >= 18.17
1. Create next app (I recommend to not use the App router)
```
npx create-next-app@latest
```
2. Create a build package, using OpenNext

## Resources:
- OpenNext Docs: https://open-next.js.org/advanced/architecture
- Example Severless Template: https://github.com/sst/open-next/issues/32#issuecomment-1421831230
