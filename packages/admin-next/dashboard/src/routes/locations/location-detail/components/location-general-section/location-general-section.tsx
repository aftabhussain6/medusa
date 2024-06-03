import {
  ArchiveBox,
  CurrencyDollar,
  Map,
  PencilSquare,
  Plus,
  Trash,
  TriangleDownMini,
} from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import {
  Badge,
  Container,
  Heading,
  IconButton,
  StatusBadge,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"
import { Divider } from "../../../../../components/common/divider"
import { NoRecords } from "../../../../../components/common/empty-table-content"
import { IconAvatar } from "../../../../../components/common/icon-avatar"
import { LinkButton } from "../../../../../components/common/link-button"
import { ListSummary } from "../../../../../components/common/list-summary"
import {
  useDeleteFulfillmentServiceZone,
  useDeleteFulfillmentSet,
} from "../../../../../hooks/api/fulfillment-sets"
import { useDeleteShippingOption } from "../../../../../hooks/api/shipping-options"
import {
  useCreateStockLocationFulfillmentSet,
  useDeleteStockLocation,
} from "../../../../../hooks/api/stock-locations"
import { getFormattedAddress } from "../../../../../lib/addresses"
import {
  StaticCountry,
  countries as staticCountries,
} from "../../../../../lib/countries"
import { formatProvider } from "../../../../../lib/format-provider"
import {
  isOptionEnabledInStore,
  isReturnOption,
} from "../../../../../lib/shipping-options"

type LocationGeneralSectionProps = {
  location: HttpTypes.AdminStockLocation
}

export const LocationGeneralSection = ({
  location,
}: LocationGeneralSectionProps) => {
  return (
    <>
      <Container className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>{location.name}</Heading>
            <Text className="text-ui-fg-subtle txt-small">
              {getFormattedAddress({ address: location.address }).join(", ")}
            </Text>
          </div>
          <Actions location={location} />
        </div>
      </Container>

      <FulfillmentSet
        locationId={location.id}
        locationName={location.name}
        type={FulfillmentSetType.Pickup}
        fulfillmentSet={location.fulfillment_sets.find(
          (f) => f.type === FulfillmentSetType.Pickup
        )}
      />

      <FulfillmentSet
        locationId={location.id}
        locationName={location.name}
        type={FulfillmentSetType.Delivery}
        fulfillmentSet={location.fulfillment_sets.find(
          (f) => f.type === FulfillmentSetType.Delivery
        )}
      />
    </>
  )
}

type ShippingOptionProps = {
  option: HttpTypes.AdminShippingOption
  fulfillmentSetId: string
  locationId: string
  isReturn?: boolean
}

function ShippingOption({
  option,
  isReturn,
  fulfillmentSetId,
  locationId,
}: ShippingOptionProps) {
  const prompt = usePrompt()
  const { t } = useTranslation()

  const isStoreOption = isOptionEnabledInStore(option)

  const { mutateAsync: deleteOption } = useDeleteShippingOption(option.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("location.shippingOptions.deleteWarning", {
        name: option.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteOption(undefined, {
      onSuccess: () => {
        toast.success(t("general.success"), {
          description: t("location.shippingOptions.toast.delete", {
            name: option.name,
          }),
          dismissLabel: t("actions.close"),
        })
      },
      onError: (e) => {
        toast.error(t("general.error"), {
          description: e.message,
          dismissLabel: t("actions.close"),
        })
      },
    })
  }

  return (
    <div className="flex items-center justify-between px-3 py-2">
      <div className="flex-1">
        <span className="txt-small font-medium">
          {option.name} - {option.shipping_profile.name} (
          {formatProvider(option.provider_id)})
        </span>
      </div>
      <Badge
        className="mr-4"
        color={isStoreOption ? "grey" : "purple"}
        size="2xsmall"
        rounded="full"
      >
        {isStoreOption ? t("general.store") : t("general.admin")}
      </Badge>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <PencilSquare />,
                label: t("location.serviceZone.editOption"),
                to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${option.service_zone_id}/shipping-option/${option.id}/edit`,
              },
              {
                label: t("location.serviceZone.editPrices"),
                icon: <CurrencyDollar />,
                to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${option.service_zone_id}/shipping-option/${option.id}/edit-pricing`,
              },
            ],
          },
          {
            actions: [
              {
                label: t("actions.delete"),
                icon: <Trash />,
                onClick: handleDelete,
              },
            ],
          },
        ]}
      />
    </div>
  )
}

type ServiceZoneOptionsProps = {
  zone: HttpTypes.AdminServiceZone
  locationId: string
  fulfillmentSetId: string
}

function ServiceZoneOptions({
  zone,
  locationId,
  fulfillmentSetId,
}: ServiceZoneOptionsProps) {
  const { t } = useTranslation()

  const shippingOptions = zone.shipping_options.filter(
    (o) => !isReturnOption(o)
  )

  const returnOptions = zone.shipping_options.filter((o) => isReturnOption(o))

  return (
    <div>
      <Divider variant="dashed" />
      <div className="flex flex-col gap-y-4 px-6 py-4">
        <div className="item-center flex justify-between">
          <span className="text-ui-fg-subtle txt-small self-center font-medium">
            {t("location.serviceZone.shippingOptions")}
          </span>
          <LinkButton
            to={`/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/shipping-option/create`}
          >
            {t("location.serviceZone.addOption")}
          </LinkButton>
        </div>

        {!!shippingOptions.length && (
          <div className="shadow-elevation-card-rest bg-ui-bg-subtle grid divide-y rounded-md">
            {shippingOptions.map((o) => (
              <ShippingOption
                key={o.id}
                option={o}
                locationId={locationId}
                fulfillmentSetId={fulfillmentSetId}
              />
            ))}
          </div>
        )}
      </div>

      <Divider variant="dashed" />

      <div className="flex flex-col gap-y-4 px-6 py-4">
        <div className="item-center flex justify-between">
          <span className="text-ui-fg-subtle txt-small self-center font-medium">
            {t("location.serviceZone.returnOptions")}
          </span>
          <LinkButton
            to={`/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/shipping-option/create?is_return`}
          >
            {t("location.serviceZone.addOption")}
          </LinkButton>
        </div>

        {!!returnOptions.length && (
          <div className="shadow-elevation-card-rest bg-ui-bg-subtle grid divide-y rounded-md">
            {returnOptions.map((o) => (
              <ShippingOption
                key={o.id}
                isReturn
                option={o}
                locationId={locationId}
                fulfillmentSetId={fulfillmentSetId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type ServiceZoneProps = {
  zone: HttpTypes.AdminServiceZone
  locationId: string
  fulfillmentSetId: string
}

function ServiceZone({ zone, locationId, fulfillmentSetId }: ServiceZoneProps) {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const [open, setOpen] = useState(false)

  const { mutateAsync: deleteZone } = useDeleteFulfillmentServiceZone(
    fulfillmentSetId,
    zone.id
  )

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("location.serviceZone.deleteWarning", {
        name: zone.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteZone(undefined, {
      onError: (e) => {
        toast.error(t("general.error"), {
          description: e.message,
          dismissLabel: t("actions.close"),
        })
      },
      onSuccess: () => {
        toast.success(t("general.success"), {
          description: t("location.serviceZone.toast.delete", {
            name: zone.name,
          }),
          dismissLabel: t("actions.close"),
        })
      },
    })
  }

  const countries = useMemo(() => {
    const countryGeoZones = zone.geo_zones.filter((g) => g.type === "country")

    const countries = countryGeoZones
      .map(({ country_code }) =>
        staticCountries.find((c) => c.iso_2 === country_code)
      )
      .filter((c) => !!c) as StaticCountry[]

    if (
      process.env.NODE_ENV === "development" &&
      countryGeoZones.length !== countries.length
    ) {
      console.warn(
        "Some countries are missing in the static countries list",
        countryGeoZones
          .filter((g) => !countries.find((c) => c.iso_2 === g.country_code))
          .map((g) => g.country_code)
      )
    }

    return countries.sort((c1, c2) => c1.name.localeCompare(c2.name))
  }, [zone.geo_zones])

  const [shippingOptionsCount, returnOptionsCount] = useMemo(() => {
    const optionsCount = zone.shipping_options.filter(
      (o) => !isReturnOption(o)
    ).length

    const returnOptionsCount = zone.shipping_options.filter((o) =>
      isReturnOption(o)
    ).length

    return [optionsCount, returnOptionsCount]
  }, [zone.shipping_options])

  return (
    <div className="flex flex-col">
      <div className="flex flex-row items-center justify-between gap-x-4 px-6 py-4">
        <IconAvatar>
          <Map />
        </IconAvatar>

        <div className="grow-1 flex flex-1 flex-col">
          <Text size="small" leading="compact" weight="plus">
            {zone.name}
          </Text>
          <div className="flex items-center gap-2">
            <ListSummary
              variant="base"
              list={countries.map((c) => c.display_name)}
              inline
              n={1}
            />
            <span>·</span>
            <Text className="text-ui-fg-subtle txt-small">
              {shippingOptionsCount}{" "}
              {t("location.serviceZone.optionsLength", {
                count: shippingOptionsCount,
              })}
            </Text>
            <span>·</span>
            <Text className="text-ui-fg-subtle txt-small">
              {returnOptionsCount}{" "}
              {t("location.serviceZone.returnOptionsLength", {
                count: returnOptionsCount,
              })}
            </Text>
          </div>
        </div>

        <div className="flex grow-0 items-center gap-4">
          <IconButton
            size="small"
            onClick={() => setOpen((s) => !s)}
            variant="transparent"
          >
            <TriangleDownMini
              style={{
                transform: `rotate(${!open ? 0 : 180}deg)`,
                transition: ".2s transform ease-in-out",
              }}
            />
          </IconButton>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: t("actions.edit"),
                    icon: <PencilSquare />,
                    to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/edit`,
                  },
                  {
                    label: t("location.serviceZone.manageAreas.action"),
                    icon: <Map />,
                    to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSetId}/service-zone/${zone.id}/edit-areas`,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    icon: <Trash />,
                    onClick: handleDelete,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      {open && (
        <ServiceZoneOptions
          fulfillmentSetId={fulfillmentSetId}
          locationId={locationId}
          zone={zone}
        />
      )}
    </div>
  )
}

enum FulfillmentSetType {
  Delivery = "delivery",
  Pickup = "pickup",
}

type FulfillmentSetProps = {
  fulfillmentSet?: HttpTypes.AdminFulfillmentSet
  locationName: string
  locationId: string
  type: FulfillmentSetType
}

function FulfillmentSet(props: FulfillmentSetProps) {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()

  const { fulfillmentSet, locationName, locationId, type } = props

  const fulfillmentSetExists = !!fulfillmentSet

  const hasServiceZones = !!fulfillmentSet?.service_zones.length

  const { mutateAsync: createFulfillmentSet } =
    useCreateStockLocationFulfillmentSet(locationId)

  const { mutateAsync: deleteFulfillmentSet } = useDeleteFulfillmentSet(
    fulfillmentSet?.id!
  )

  const handleCreate = async () => {
    await createFulfillmentSet(
      {
        name: `${locationName} ${
          type === FulfillmentSetType.Pickup ? "pick up" : type
        }`,
        type,
      },
      {
        onError: (e) => {
          toast.error(t("general.error"), {
            description: e.message,
            dismissLabel: t("actions.close"),
          })
        },
      }
    )
  }

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("location.fulfillmentSet.disableWarning", {
        name: fulfillmentSet?.name,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteFulfillmentSet(undefined, {
      onSuccess: () => {
        toast.success(t("general.success"), {
          description: t("location.fulfillmentSet.toast.disable", {
            name: fulfillmentSet?.name,
          }),
          dismissable: true,
          dismissLabel: t("actions.close"),
        })
      },
      onError: (e) => {
        toast.error(t("general.error"), {
          description: e.message,
          dismissable: true,
          dismissLabel: t("actions.close"),
        })
      },
    })
  }

  const groups = fulfillmentSet
    ? [
        {
          actions: [
            {
              icon: <Plus />,
              label: t("location.fulfillmentSet.addZone"),
              to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSet.id}/service-zones/create`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.disable"),
              onClick: handleDelete,
            },
          ],
        },
      ]
    : [
        {
          actions: [
            {
              icon: <Plus />,
              label: t("actions.enable"),
              onClick: handleCreate,
            },
          ],
        },
      ]

  return (
    <Container className="p-0">
      <div className="flex flex-col divide-y">
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="large" weight="plus" className="flex-1" as="div">
            {t(`location.fulfillmentSet.${type}.offers`)}
          </Text>
          <div className="flex items-center gap-4">
            <StatusBadge color={fulfillmentSetExists ? "green" : "red"}>
              {t(
                fulfillmentSetExists ? "statuses.enabled" : "statuses.disabled"
              )}
            </StatusBadge>

            <ActionMenu groups={groups} />
          </div>
        </div>

        {fulfillmentSetExists && !hasServiceZones && (
          <div className="flex items-center justify-center py-8 pt-6">
            <NoRecords
              message={t("location.fulfillmentSet.placeholder")}
              className="h-fit"
              action={{
                to: `/settings/locations/${locationId}/fulfillment-set/${fulfillmentSet.id}/service-zones/create`,
                label: t("location.fulfillmentSet.addZone"),
              }}
            />
          </div>
        )}

        {hasServiceZones && (
          <div className="flex flex-col divide-y">
            {fulfillmentSet?.service_zones.map((zone) => (
              <ServiceZone
                zone={zone}
                key={zone.id}
                locationId={locationId}
                fulfillmentSetId={fulfillmentSet.id}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

const Actions = ({ location }: { location: HttpTypes.AdminStockLocation }) => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mutateAsync } = useDeleteStockLocation(location.id)
  const prompt = usePrompt()

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("location.deleteLocationWarning", {
        name: location.name,
      }),
      verificationText: location.name,
      verificationInstruction: t("general.typeToConfirm"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("general.success"), {
          description: t("location.toast.delete"),
          dismissLabel: t("actions.close"),
        })
        navigate("/settings/locations", { replace: true })
      },
      onError: (e) => {
        toast.error(t("general.error"), {
          description: e.message,
          dismissLabel: t("actions.close"),
        })
      },
    })
  }

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `edit`,
            },
            {
              icon: <ArchiveBox />,
              label: t("location.viewInventory"),
              to: `/inventory?location_id=${location.id}`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  )
}